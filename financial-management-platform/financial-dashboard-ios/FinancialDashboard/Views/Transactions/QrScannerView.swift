import SwiftUI
import AVFoundation

// MARK: - SwiftUI wrapper

struct QrScannerView: UIViewControllerRepresentable {
    /// Called on the main thread when a QR code string is decoded.
    var onScan: (String) -> Void
    var onCancel: () -> Void

    func makeUIViewController(context: Context) -> QrCaptureViewController {
        let vc = QrCaptureViewController()
        vc.onScan   = onScan
        vc.onCancel = onCancel
        return vc
    }

    func updateUIViewController(_ uiViewController: QrCaptureViewController, context: Context) {}
}

// MARK: - AVFoundation view controller

final class QrCaptureViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onScan:   ((String) -> Void)?
    var onCancel: (() -> Void)?

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var didDeliver = false

    // MARK: Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        checkPermission()
        addCancelButton()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.startRunning()
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.stopRunning()
        }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
        updateScanOverlay()
    }

    // MARK: Permission + setup
    private func checkPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            setupSession()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    if granted { self?.setupSession() } else { self?.showDenied() }
                }
            }
        default:
            showDenied()
        }
    }

    private func setupSession() {
        let session = AVCaptureSession()
        guard let device = AVCaptureDevice.default(for: .video),
              let input  = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else {
            showError("Could not access camera.")
            return
        }
        session.addInput(input)

        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else {
            showError("Could not set up scanner.")
            return
        }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.qr]

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = view.layer.bounds
        view.layer.insertSublayer(preview, at: 0)
        previewLayer = preview

        captureSession = session
        addScanOverlay()

        DispatchQueue.global(qos: .userInitiated).async {
            session.startRunning()
        }
    }

    // MARK: AVCaptureMetadataOutputObjectsDelegate
    func metadataOutput(_ output: AVCaptureMetadataOutput,
                        didOutput metadataObjects: [AVMetadataObject],
                        from connection: AVCaptureConnection) {
        guard !didDeliver,
              let obj = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let raw = obj.stringValue, !raw.isEmpty else { return }
        didDeliver = true
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.stopRunning()
        }
        onScan?(raw)
    }

    // MARK: UI helpers
    private func addCancelButton() {
        let btn = UIButton(type: .system)
        btn.setTitle("Cancel", for: .normal)
        btn.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        btn.setTitleColor(.white, for: .normal)
        btn.backgroundColor = UIColor.black.withAlphaComponent(0.45)
        btn.layer.cornerRadius = 12
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.contentEdgeInsets = UIEdgeInsets(top: 10, left: 24, bottom: 10, right: 24)
        btn.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(btn)
        NSLayoutConstraint.activate([
            btn.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            btn.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
        ])
    }

    @objc private func cancelTapped() { onCancel?() }

    // Scan frame overlay
    private var overlayView: UIView?
    private func addScanOverlay() {
        let overlay = UIView()
        overlay.isUserInteractionEnabled = false
        overlay.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(overlay)
        NSLayoutConstraint.activate([
            overlay.topAnchor.constraint(equalTo: view.topAnchor),
            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            overlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        overlayView = overlay
        updateScanOverlay()

        let label = UILabel()
        label.text = "Point camera at a QR code"
        label.textColor = .white
        label.font = .systemFont(ofSize: 14)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.topAnchor.constraint(equalTo: view.centerYAnchor, constant: view.bounds.width * 0.45),
        ])
    }

    private func updateScanOverlay() {
        guard let overlay = overlayView else { return }
        overlay.layer.sublayers?.removeAll()
        let size  = min(view.bounds.width, view.bounds.height) * 0.72
        let rect  = CGRect(
            x: (view.bounds.width  - size) / 2,
            y: (view.bounds.height - size) / 2,
            width: size, height: size
        )
        // dim everywhere except the scan box
        let fullPath = UIBezierPath(rect: view.bounds)
        let holePath = UIBezierPath(roundedRect: rect, cornerRadius: 12)
        fullPath.append(holePath)
        fullPath.usesEvenOddFillRule = true
        let dim = CAShapeLayer()
        dim.path = fullPath.cgPath
        dim.fillColor = UIColor.black.withAlphaComponent(0.55).cgColor
        dim.fillRule = .evenOdd
        overlay.layer.addSublayer(dim)
        // corner brackets
        let bracketColor = UIColor(red: 0.153, green: 0.867, blue: 0.961, alpha: 1).cgColor
        let len: CGFloat = 24
        let thick: CGFloat = 3
        for (dx, dy): (CGFloat, CGFloat) in [(0,0),(size-len,0),(0,size-len),(size-len,size-len)] {
            let hLine = CALayer(); hLine.backgroundColor = bracketColor
            hLine.frame = CGRect(x: rect.minX + dx, y: rect.minY + dy, width: len, height: thick)
            overlay.layer.addSublayer(hLine)
            let vLine = CALayer(); vLine.backgroundColor = bracketColor
            vLine.frame = CGRect(x: rect.minX + (dx == 0 ? 0 : dx + len - thick), y: rect.minY + dy, width: thick, height: len)
            overlay.layer.addSublayer(vLine)
        }
    }

    private func showDenied() {
        showError("Camera access denied. Please enable it in Settings.")
    }

    private func showError(_ msg: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let lbl = UILabel()
            lbl.text = msg
            lbl.textColor = .white
            lbl.textAlignment = .center
            lbl.numberOfLines = 0
            lbl.translatesAutoresizingMaskIntoConstraints = false
            self.view.addSubview(lbl)
            NSLayoutConstraint.activate([
                lbl.centerXAnchor.constraint(equalTo: self.view.centerXAnchor),
                lbl.centerYAnchor.constraint(equalTo: self.view.centerYAnchor),
                lbl.leadingAnchor.constraint(equalTo: self.view.leadingAnchor, constant: 32),
                lbl.trailingAnchor.constraint(equalTo: self.view.trailingAnchor, constant: -32),
            ])
        }
    }
}
