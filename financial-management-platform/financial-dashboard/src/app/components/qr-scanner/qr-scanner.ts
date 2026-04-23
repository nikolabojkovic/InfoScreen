import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnDestroy,
  Output,
  signal,
  ViewChild,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { QrParserService, ParsedQrBill } from '../../services/qr-parser.service';
import jsQR from 'jsqr';
import { Decoder, Detector, binarize, grayscale } from '@nuintun/qrcode';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.scss',
  imports: [DecimalPipe],
  encapsulation: ViewEncapsulation.None,
})
export class QrScanner implements AfterViewInit, OnDestroy {
  @Output() scanned = new EventEmitter<ParsedQrBill>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('readerEl', { static: false }) readerEl!: ElementRef<HTMLDivElement>;
  @ViewChild('cameraVideo', { static: false }) cameraVideo?: ElementRef<HTMLVideoElement>;

  private parser = inject(QrParserService);
  private scanner: Html5Qrcode | null = null;
  private mediaStream: MediaStream | null = null;
  private scanTimer: number | null = null;
  private busy = false;

  scanning = signal(false);
  nativeMode = signal(false);
  uploadDecoding = signal(false);
  error = signal('');
  lastRaw = signal('');
  parsedBill = signal<ParsedQrBill | null>(null);

  ngAfterViewInit(): void {
    this.startScanning();
  }

  ngOnDestroy(): void {
    this.forceCleanup();
  }

  private async startScanning(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.error.set('');
    this.parsedBill.set(null);
    this.lastRaw.set('');

    if (this.shouldUseNativeCamera()) {
      try {
        await this.startNativeCameraScanning();
      } catch (err: any) {
        console.warn('[QR] native camera scanning failed, falling back:', err);
        this.nativeMode.set(false);
      }

      if (this.scanning()) {
        this.busy = false;
        return;
      }
    }

    console.log('[QR] startScanning called');
    this.nativeMode.set(false);

    // Always create a fresh instance
    this.scanner = new Html5Qrcode('qr-reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
    });

    this.scanning.set(true);

    const config = {
      fps: 15,
      disableFlip: true,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const size = Math.min(viewfinderWidth, viewfinderHeight);
        return { width: Math.floor(size * 0.85), height: Math.floor(size * 0.85) };
      },
    };

    const successCb = (decodedText: string) => this.onScanSuccess(decodedText);
    const errorCb = () => {};

    try {
      console.log('[QR] calling scanner.start()');
      await this.scanner.start(
        { facingMode: 'environment' },
        config,
        successCb,
        errorCb
      );
      console.log('[QR] scanner started successfully');
    } catch (err: any) {
      console.error('[QR] scanner.start() failed:', err);
      this.scanning.set(false);
      const msg: string = err?.message ?? String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
        this.error.set('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else {
        this.error.set(msg || 'Could not start camera.');
      }
    }
    this.busy = false;
  }

  private onScanSuccess(decodedText: string): void {
    console.log('[QR] onScanSuccess, busy:', this.busy, 'text length:', decodedText.length);
    if (this.busy) return;
    this.lastRaw.set(decodedText);

    const parsed = this.parser.parse(decodedText);
    console.log('[QR] parsed result:', parsed);
    if (parsed) {
      this.parsedBill.set(parsed);
      this.stopScanner();
    } else {
      this.error.set('Could not parse QR code data. Try a different bill.');
    }
  }

  /** Fire-and-forget stop — just stops scanning, no restart */
  private async stopScanner(): Promise<void> {
    if (this.busy && !this.nativeMode()) return;
    this.busy = true;
    try {
      if (this.nativeMode()) {
        this.stopNativeCamera();
      } else if (this.scanner) {
        await this.scanner.stop();
      }
    } catch {
      // ignore
    }
    this.scanning.set(false);
    this.busy = false;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.error.set('');
    this.forceCleanup();
    this.uploadDecoding.set(true);

    // Give the browser a chance to paint the spinner before decoding starts.
    await this.yieldToUi();

    let decoded: string | null = null;

    try {
      // 1) Try @nuintun/qrcode — stronger detector/decoder for dense QR images
      try {
        decoded = await this.decodeWithNuintun(file);
        if (decoded) console.log('[QR] nuintun/qrcode decoded OK');
      } catch (err) {
        console.warn('[QR] nuintun/qrcode failed:', err);
      }

      // 2) Try jsQR as a fallback
      if (!decoded) {
        try {
          decoded = await this.decodeWithJsQR(file);
          if (decoded) console.log('[QR] jsQR decoded OK');
        } catch (err) {
          console.warn('[QR] jsQR failed:', err);
        }
      }

      // 3) Try native BarcodeDetector
      if (!decoded && 'BarcodeDetector' in window) {
        try {
          const bitmap = await createImageBitmap(file);
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(bitmap);
          bitmap.close();
          if (barcodes.length > 0) {
            decoded = barcodes[0].rawValue;
            console.log('[QR] BarcodeDetector decoded OK');
          }
        } catch (err) {
          console.warn('[QR] BarcodeDetector failed:', err);
        }
      }
    } finally {
      this.uploadDecoding.set(false);
      input.value = '';
    }

    if (decoded) {
      this.onScanSuccess(decoded);
    } else {
      this.error.set('No QR code found in the image. Try a clearer photo.');
    }
  }

  /** Decode QR from image file using @nuintun/qrcode */
  private decodeWithNuintun(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          URL.revokeObjectURL(img.src);
          resolve(null);
          return;
        }

        context.drawImage(img, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const luminances = grayscale(imageData);
        const attempts: Array<{ invert: boolean; strict: boolean }> = [
          { invert: false, strict: false },
          { invert: true, strict: false },
          { invert: false, strict: true },
          { invert: true, strict: true },
        ];

        for (const attempt of attempts) {
          try {
            const binarized = binarize(luminances, canvas.width, canvas.height);
            if (attempt.invert) {
              binarized.flip();
            }

            const detector = new Detector({ strict: attempt.strict });
            const decoder = new Decoder();
            const detected = detector.detect(binarized);

            for (let current = detected.next(); !current.done; current = detected.next()) {
              try {
                const decoded = decoder.decode(current.value.matrix);
                URL.revokeObjectURL(img.src);
                resolve(decoded.content);
                return;
              } catch {
                // Keep trying other detected regions and modes.
              }
            }
          } catch {
            // Try the next combination.
          }

          // Let the UI breathe between decode attempts.
          await this.yieldToUi();
        }

        URL.revokeObjectURL(img.src);
        resolve(null);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(null);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /** Decode QR from image file using jsQR — tries multiple resolutions */
  private decodeWithJsQR(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const scaleFactors = [1, 2];
        const rotations = [0, 90, 180, 270];

        for (const scaleFactor of scaleFactors) {
          const baseWidth = Math.min(Math.round(img.width * scaleFactor), 2400);
          const baseHeight = Math.min(Math.round(img.height * scaleFactor), 2400);

          for (const rotation of rotations) {
            const imageData = this.renderQrCandidate(img, baseWidth, baseHeight, rotation);
            const result = this.tryDecodeImageData(imageData);
            if (result) {
              URL.revokeObjectURL(img.src);
              resolve(result);
              return;
            }

            // Yield after each failed rotation so the spinner keeps moving.
            await this.yieldToUi();
          }

          // Extra yield between scale passes.
          await this.yieldToUi();
        }

        URL.revokeObjectURL(img.src);
        resolve(null);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(null);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  private renderQrCandidate(img: HTMLImageElement, width: number, height: number, rotation: number): ImageData {
    const sourceWidth = img.width;
    const sourceHeight = img.height;
    const rotated = rotation === 90 || rotation === 180 || rotation === 270;
    const canvas = document.createElement('canvas');
    canvas.width = rotated ? height : width;
    canvas.height = rotated ? width : height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Could not create canvas context');
    }

    context.imageSmoothingEnabled = false;
    context.save();

    if (rotation === 90) {
      context.translate(canvas.width, 0);
      context.rotate(Math.PI / 2);
      context.drawImage(img, 0, 0, sourceWidth, sourceHeight, 0, 0, canvas.height, canvas.width);
    } else if (rotation === 180) {
      context.translate(canvas.width, canvas.height);
      context.rotate(Math.PI);
      context.drawImage(img, 0, 0, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    } else if (rotation === 270) {
      context.translate(0, canvas.height);
      context.rotate(-Math.PI / 2);
      context.drawImage(img, 0, 0, sourceWidth, sourceHeight, 0, 0, canvas.height, canvas.width);
    } else {
      context.drawImage(img, 0, 0, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    }

    context.restore();

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Boost contrast and binarize to help dense QR codes from camera photos.
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
      const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
      const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
      const thresholded = contrasted > 150 ? 255 : 0;
      data[index] = thresholded;
      data[index + 1] = thresholded;
      data[index + 2] = thresholded;
    }

    return imageData;
  }

  private tryDecodeImageData(imageData: ImageData): string | null {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return result?.data ?? null;
  }

  private async yieldToUi(): Promise<void> {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }

  confirmBill(): void {
    const bill = this.parsedBill();
    if (bill) {
      this.scanned.emit(bill);
    }
  }

  async rescan(): Promise<void> {
    this.forceCleanup();
    this.parsedBill.set(null);
    this.lastRaw.set('');
    this.error.set('');
    // Wait for DOM to re-render the #qr-reader element, then start fresh
    setTimeout(() => this.startScanning(), 200);
  }

  async close(): Promise<void> {
    this.forceCleanup();
    this.closed.emit();
  }

  /** Synchronous best-effort teardown — never awaits, never throws */
  private forceCleanup(): void {
    const s = this.scanner;
    this.scanner = null;
    this.stopNativeCamera();
    this.scanning.set(false);
    this.nativeMode.set(false);
    this.busy = false;
    if (s) {
      try {
        const state = s.getState();
        if (state === 2) {
          s.stop().then(() => s.clear()).catch(() => {
            try { s.clear(); } catch { /* noop */ }
          });
        } else {
          s.clear();
        }
      } catch {
        // ignore
      }
    }
  }

  private shouldUseNativeCamera(): boolean {
    const userAgent = navigator.userAgent;
    return /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
  }

  private async startNativeCameraScanning(): Promise<void> {
    this.nativeMode.set(true);
    this.scanning.set(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    this.mediaStream = stream;
    const video = this.cameraVideo?.nativeElement;
    if (!video) {
      throw new Error('Camera video element not available');
    }

    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;

    await video.play();

    this.scanTimer = window.setInterval(() => {
      void this.scanNativeFrame();
    }, 250);

    console.log('[QR] native camera started successfully');
  }

  private async scanNativeFrame(): Promise<void> {
    if (!this.nativeMode() || !this.cameraVideo?.nativeElement || this.parsedBill()) return;

    const video = this.cameraVideo.nativeElement;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    let decodedText: string | null = null;

    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          decodedText = barcodes[0].rawValue;
        }
      } catch {
        // ignore and fall back to jsQR
      }
    }

    if (!decodedText) {
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
      decodedText = result?.data ?? null;
    }

    if (decodedText) {
      console.log('[QR] native camera decoded OK');
      this.onScanSuccess(decodedText);
    }
  }

  private stopNativeCamera(): void {
    if (this.scanTimer !== null) {
      window.clearInterval(this.scanTimer);
      this.scanTimer = null;
    }

    const stream = this.mediaStream;
    this.mediaStream = null;

    const video = this.cameraVideo?.nativeElement;
    if (video) {
      try {
        video.pause();
        video.srcObject = null;
      } catch {
        // ignore
      }
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
}
