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
  // Cached across frames to avoid per-frame object creation
  private barcodeDetector: any = null;
  private nativeScanCanvas: HTMLCanvasElement | null = null;
  private nativeScanCtx: CanvasRenderingContext2D | null = null;

  scanning = signal(false);
  nativeMode = signal(false);
  uploadDecoding = signal(false);
  captureDecoding = signal(false);
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
      disableFlip: false,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const size = Math.min(viewfinderWidth, viewfinderHeight);
        return { width: Math.floor(size * 0.85), height: Math.floor(size * 0.85) };
      },
    };

    const successCb = (decodedText: string) => this.onScanSuccess(decodedText);
    const errorCb = () => {};

    let startErr: any = null;
    for (const facingMode of ['environment', 'user'] as const) {
      try {
        console.log('[QR] calling scanner.start() with facingMode:', facingMode);
        await this.scanner.start(
          { facingMode },
          config,
          successCb,
          errorCb
        );
        console.log('[QR] scanner started successfully with facingMode:', facingMode);
        startErr = null;
        break;
      } catch (err: any) {
        console.warn('[QR] scanner.start() failed for facingMode', facingMode, err);
        startErr = err;
        // Stop/clear the failed instance before retrying
        try { await this.scanner!.stop(); } catch { /* noop */ }
        try { this.scanner!.clear(); } catch { /* noop */ }
        // Re-create for the next attempt
        this.scanner = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
      }
    }

    if (startErr) {
      console.error('[QR] scanner.start() failed for all cameras:', startErr);
      this.scanning.set(false);
      const msg: string = startErr?.message ?? String(startErr);
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
      // 1) Native BarcodeDetector — fastest when available (Android Chrome, desktop)
      if ('BarcodeDetector' in window) {
        try {
          const bitmap = await createImageBitmap(file);
          const detector = this.getBarcodeDetector();
          if (detector) {
            const barcodes = await detector.detect(bitmap);
            if (barcodes.length > 0) {
              decoded = barcodes[0].rawValue;
              console.log('[QR] BarcodeDetector decoded OK');
            }
          }
          bitmap.close();
        } catch (err) {
          console.warn('[QR] BarcodeDetector failed:', err);
        }
      }

      // 2) @nuintun/qrcode — strong multi-attempt detector, good for dense/damaged QR
      if (!decoded) {
        try {
          decoded = await this.decodeWithNuintun(file);
          if (decoded) console.log('[QR] nuintun/qrcode decoded OK');
        } catch (err) {
          console.warn('[QR] nuintun/qrcode failed:', err);
        }
      }

      // 3) jsQR with multiple scale and threshold profiles
      if (!decoded) {
        try {
          decoded = await this.decodeWithJsQR(file);
          if (decoded) console.log('[QR] jsQR decoded OK');
        } catch (err) {
          console.warn('[QR] jsQR failed:', err);
        }
      }

      // 4) Center-crop fallback — helps when QR is in a corner or surrounded by whitespace
      if (!decoded) {
        try {
          decoded = await this.decodeCenterCrop(file);
          if (decoded) console.log('[QR] center-crop decoded OK');
        } catch (err) {
          console.warn('[QR] center-crop failed:', err);
        }
      }
    } finally {
      this.uploadDecoding.set(false);
      input.value = '';
    }

    if (decoded) {
      this.onScanSuccess(decoded);
    } else {
      this.error.set('No QR code found. Try a clearer photo or move closer to the QR code.');
    }
  }

  /** Decode QR from image file using @nuintun/qrcode */
  private decodeWithNuintun(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        // For large images try full and half scale — nuintun can struggle at very high resolution
        const isLarge = img.width > 2000 || img.height > 2000;
        const scaleSteps = isLarge ? [1, 0.5] : [1];

        for (const scale of scaleSteps) {
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;

          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) {
            URL.revokeObjectURL(img.src);
            resolve(null);
            return;
          }

          context.drawImage(img, 0, 0, w, h);
          const imageData = context.getImageData(0, 0, w, h);
          const luminances = grayscale(imageData);
          const attempts: Array<{ invert: boolean; strict: boolean }> = [
            { invert: false, strict: false },
            { invert: true, strict: false },
            { invert: false, strict: true },
            { invert: true, strict: true },
          ];

          for (const attempt of attempts) {
            try {
              const binarized = binarize(luminances, w, h);
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
        const scaleFactors = [1, 1.5, 0.5];
        const rotations = [0, 90, 180, 270];
        // Multiple contrast/threshold profiles to handle varied print quality
        const enhanceProfiles = [
          { contrast: 1.4, threshold: 128 },
          { contrast: 1.8, threshold: 145 },
          { contrast: 2.5, threshold: 165 },
        ];

        for (const scaleFactor of scaleFactors) {
          // Cap at 3000px — iOS GPU texture limit is ~4096px but 3000 is safe across all devices
          const baseWidth = Math.min(Math.round(img.width * scaleFactor), 3000);
          const baseHeight = Math.min(Math.round(img.height * scaleFactor), 3000);

          for (const rotation of rotations) {
            // Pass 1: raw pixels — jsQR uses adaptive thresholding internally
            const rawData = this.renderQrCandidate(img, baseWidth, baseHeight, rotation, false);
            let result = this.tryDecodeImageData(rawData);
            if (result) {
              URL.revokeObjectURL(img.src);
              resolve(result);
              return;
            }

            // Pass 2+: multiple contrast/threshold profiles
            for (const profile of enhanceProfiles) {
              const processedData = this.renderQrCandidate(img, baseWidth, baseHeight, rotation, true, profile.contrast, profile.threshold);
              result = this.tryDecodeImageData(processedData);
              if (result) {
                URL.revokeObjectURL(img.src);
                resolve(result);
                return;
              }
            }

            // Yield after each rotation so the spinner keeps moving.
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

  /** Returns a cached BarcodeDetector instance (null if unsupported) */
  private getBarcodeDetector(): any {
    if (!this.barcodeDetector && 'BarcodeDetector' in window) {
      try {
        this.barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        // not supported
      }
    }
    return this.barcodeDetector;
  }

  /**
   * Fallback: try decoding various center-crop regions of the image.
   * Helps when the QR is in a corner, or image whitespace is confusing the decoders.
   */
  private decodeCenterCrop(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        // Different crop regions — center crops + horizontal/vertical strips
        const regions = [
          { x: 0.1,  y: 0.1,  w: 0.8, h: 0.8 },
          { x: 0.2,  y: 0.2,  w: 0.6, h: 0.6 },
          { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
          { x: 0.0,  y: 0.15, w: 1.0, h: 0.7 },
          { x: 0.15, y: 0.0,  w: 0.7, h: 1.0 },
        ];
        const enhanceProfiles = [
          { contrast: 1.8, threshold: 145 },
          { contrast: 2.5, threshold: 160 },
        ];

        for (const region of regions) {
          const srcX = Math.round(img.width * region.x);
          const srcY = Math.round(img.height * region.y);
          const srcW = Math.round(img.width * region.w);
          const srcH = Math.round(img.height * region.h);

          // Upscale small crops but cap at 2000px per side
          const scale = Math.min(2, 2000 / Math.max(srcW, srcH));
          const dstW = Math.round(srcW * scale);
          const dstH = Math.round(srcH * scale);

          const canvas = document.createElement('canvas');
          canvas.width = dstW;
          canvas.height = dstH;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) continue;

          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH);
          const rawData = ctx.getImageData(0, 0, dstW, dstH);

          // Raw pass
          let result = this.tryDecodeImageData(rawData);
          if (result) { URL.revokeObjectURL(img.src); resolve(result); return; }

          // Enhanced passes with multiple profiles
          for (const profile of enhanceProfiles) {
            const data = new Uint8ClampedArray(rawData.data);
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              const v = Math.min(255, Math.max(0, (gray - 128) * profile.contrast + 128)) > profile.threshold ? 255 : 0;
              data[i] = data[i + 1] = data[i + 2] = v;
              data[i + 3] = 255;
            }
            result = this.tryDecodeImageData(new ImageData(data, dstW, dstH));
            if (result) { URL.revokeObjectURL(img.src); resolve(result); return; }
          }

          await this.yieldToUi();
        }

        URL.revokeObjectURL(img.src);
        resolve(null);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); resolve(null); };
      img.src = URL.createObjectURL(file);
    });
  }

  private renderQrCandidate(
    img: HTMLImageElement,
    width: number,
    height: number,
    rotation: number,
    enhance = true,
    contrastFactor = 1.8,
    thresholdValue = 150,
  ): ImageData {
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

    if (enhance) {
      // Boost contrast and binarize to help low-contrast / photocopied QR codes.
      const data = imageData.data;
      for (let index = 0; index < data.length; index += 4) {
        const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
        const contrasted = Math.min(255, Math.max(0, (gray - 128) * contrastFactor + 128));
        const thresholded = contrasted > thresholdValue ? 255 : 0;
        data[index] = thresholded;
        data[index + 1] = thresholded;
        data[index + 2] = thresholded;
      }
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
    this.barcodeDetector = null;
    this.nativeScanCanvas = null;
    this.nativeScanCtx = null;
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
    }, 500);

    console.log('[QR] native camera started successfully');
  }

  private async scanNativeFrame(): Promise<void> {
    if (!this.nativeMode() || !this.cameraVideo?.nativeElement || this.parsedBill()) return;

    const video = this.cameraVideo.nativeElement;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    let decodedText: string | null = null;

    // 1) Use cached BarcodeDetector — fastest on supporting browsers
    const detector = this.getBarcodeDetector();
    if (detector) {
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          decodedText = barcodes[0].rawValue;
        }
      } catch {
        // ignore and fall back to jsQR
      }
    }

    if (!decodedText) {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // Reuse a single persistent canvas/context to avoid per-frame allocation
      if (!this.nativeScanCanvas || this.nativeScanCanvas.width !== width || this.nativeScanCanvas.height !== height) {
        this.nativeScanCanvas = document.createElement('canvas');
        this.nativeScanCanvas.width = width;
        this.nativeScanCanvas.height = height;
        this.nativeScanCtx = this.nativeScanCanvas.getContext('2d', { willReadFrequently: true });
      }

      const ctx = this.nativeScanCtx;
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      // Pass 1: raw pixels — let jsQR's adaptive thresholding work
      decodedText = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;

      // Pass 2: contrast-enhanced — helps dim/glare-affected camera frames
      if (!decodedText) {
        const enhanced = new Uint8ClampedArray(imageData.data);
        for (let i = 0; i < enhanced.length; i += 4) {
          const gray = 0.299 * enhanced[i] + 0.587 * enhanced[i + 1] + 0.114 * enhanced[i + 2];
          const v = Math.min(255, Math.max(0, (gray - 128) * 2.0 + 128)) > 140 ? 255 : 0;
          enhanced[i] = enhanced[i + 1] = enhanced[i + 2] = v;
          enhanced[i + 3] = 255;
        }
        decodedText = jsQR(enhanced, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
      }

      // Pass 3: @nuintun/qrcode — far more robust detector for dense/high-version QR codes
      if (!decodedText) {
        try {
          const luminances = grayscale(imageData);
          for (const { invert, strict } of [
            { invert: false, strict: false },
            { invert: true,  strict: false },
          ]) {
            const binarized = binarize(luminances, width, height);
            if (invert) binarized.flip();
            const detected = new Detector({ strict }).detect(binarized);
            const decoder = new Decoder();
            for (let cur = detected.next(); !cur.done; cur = detected.next()) {
              try {
                decodedText = decoder.decode(cur.value.matrix).content;
                break;
              } catch { /* keep trying */ }
            }
            if (decodedText) break;
          }
        } catch { /* ignore */ }
      }

      // Pass 4: downscale by 50% — dense QR codes can be easier at lower resolution
      if (!decodedText) {
        try {
          const halfW = Math.floor(width / 2);
          const halfH = Math.floor(height / 2);
          const halfCanvas = document.createElement('canvas');
          halfCanvas.width = halfW;
          halfCanvas.height = halfH;
          const halfCtx = halfCanvas.getContext('2d', { willReadFrequently: true });
          if (halfCtx) {
            halfCtx.drawImage(video, 0, 0, halfW, halfH);
            const halfData = halfCtx.getImageData(0, 0, halfW, halfH);
            decodedText = jsQR(halfData.data, halfW, halfH, { inversionAttempts: 'attemptBoth' })?.data ?? null;
            if (!decodedText) {
              const luminances = grayscale(halfData);
              const binarized = binarize(luminances, halfW, halfH);
              const detected = new Detector({ strict: false }).detect(binarized);
              const decoder = new Decoder();
              for (let cur = detected.next(); !cur.done; cur = detected.next()) {
                try { decodedText = decoder.decode(cur.value.matrix).content; break; } catch { /* keep */ }
              }
            }
          }
        } catch { /* ignore */ }
      }
    } // end if (!decodedText) outer block

    if (decodedText) {
      console.log('[QR] native camera decoded OK');
      this.onScanSuccess(decodedText);
    }
  }

  /**
   * Captures the current live video frame and runs the full multi-library decode pipeline
   * (same quality as file upload). Intended as a "tap to decode" fallback for dense QR codes.
   */
  async captureFrame(): Promise<void> {
    if (this.captureDecoding() || !this.cameraVideo?.nativeElement) return;
    const video = this.cameraVideo.nativeElement;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    this.captureDecoding.set(true);
    this.error.set('');
    await this.yieldToUi();

    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.96));
      if (!blob) return;

      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      let decoded: string | null = null;

      decoded = await this.decodeWithNuintun(file);
      if (!decoded) decoded = await this.decodeWithJsQR(file);
      if (!decoded) decoded = await this.decodeCenterCrop(file);

      if (decoded) {
        this.onScanSuccess(decoded);
      } else {
        this.error.set('QR code not found. Hold the camera closer and steady, then try again.');
      }
    } finally {
      this.captureDecoding.set(false);
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
