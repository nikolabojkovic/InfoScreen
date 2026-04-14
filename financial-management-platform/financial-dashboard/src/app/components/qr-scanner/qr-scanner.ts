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

  private parser = inject(QrParserService);
  private scanner: Html5Qrcode | null = null;

  scanning = signal(false);
  error = signal('');
  lastRaw = signal('');
  parsedBill = signal<ParsedQrBill | null>(null);

  ngAfterViewInit(): void {
    this.startScanning();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private async startScanning(): Promise<void> {
    this.error.set('');
    this.parsedBill.set(null);
    this.lastRaw.set('');

    this.scanner = new Html5Qrcode('qr-reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });

    this.scanning.set(true);

    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.min(viewfinderWidth, viewfinderHeight);
            return { width: Math.floor(size * 0.85), height: Math.floor(size * 0.85) };
          },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => this.onScanSuccess(decodedText),
        () => {
          // Silent — no QR in frame is normal
        }
      );
    } catch (err: any) {
      this.scanning.set(false);
      this.error.set(err?.message || 'Camera access denied. Please allow camera permission.');
    }
  }

  private async onScanSuccess(decodedText: string): Promise<void> {
    this.lastRaw.set(decodedText);

    const parsed = this.parser.parse(decodedText);
    if (parsed) {
      this.parsedBill.set(parsed);
      await this.cleanup();
    } else {
      this.error.set('Could not parse QR code data. Try a different bill.');
    }
  }

  confirmBill(): void {
    const bill = this.parsedBill();
    if (bill) {
      this.scanned.emit(bill);
    }
  }

  async rescan(): Promise<void> {
    this.parsedBill.set(null);
    this.lastRaw.set('');
    this.error.set('');
    this.startScanning();
  }

  async close(): Promise<void> {
    await this.cleanup();
    this.closed.emit();
  }

  private async cleanup(): Promise<void> {
    if (this.scanner) {
      try {
        const state = this.scanner.getState();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await this.scanner.stop();
        }
        this.scanner.clear();
      } catch {
        // ignore cleanup errors
      }
      this.scanner = null;
      this.scanning.set(false);
    }
  }
}
