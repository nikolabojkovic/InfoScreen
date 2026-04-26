import Foundation

// MARK: - Model

struct ParsedQrBill: Identifiable {
    let id = UUID()
    var recipient: String
    var amount: Double
    var currency: String
    var account: String
    var referenceNumber: String
    var paymentCode: String
    var paymentPurpose: String
    var description: String
}

// MARK: - Parser (mirrors Angular QrParserService)

enum QrParser {
    static func parse(_ raw: String) -> ParsedQrBill? {
        guard !raw.isEmpty else { return nil }

        if raw.hasPrefix("http://") || raw.hasPrefix("https://") {
            return parseUrl(raw)
        }
        if raw.contains("|") && raw.contains(":") {
            return parseNbsIps(raw)
        }
        if raw.trimmingCharacters(in: .whitespaces).hasPrefix("{") {
            return parseJson(raw)
        }
        return parsePlainText(raw)
    }

    // MARK: Serbian NBS IPS (pipe-delimited)
    private static func parseNbsIps(_ raw: String) -> ParsedQrBill? {
        var fields: [String: String] = [:]
        for part in raw.split(separator: "|") {
            let s = String(part)
            if let colonIdx = s.firstIndex(of: ":") {
                let key = String(s[s.startIndex ..< colonIdx]).trimmingCharacters(in: .whitespaces).uppercased()
                let val = String(s[s.index(after: colonIdx)...]).trimmingCharacters(in: .whitespaces)
                fields[key] = val
            }
        }

        var amount: Double = 0
        var currency = "RSD"
        let amountField = fields["I"] ?? fields["A"] ?? ""
        if !amountField.isEmpty {
            let pattern = #"([A-Z]{3})?(\d+(?:[.,]\d+)?)"#
            if let match = amountField.range(of: pattern, options: .regularExpression) {
                let matched = String(amountField[match])
                let numPart = matched.components(separatedBy: CharacterSet.letters).joined()
                    .trimmingCharacters(in: .whitespaces)
                amount = Double(numPart.replacingOccurrences(of: ",", with: ".")) ?? 0
                if let currMatch = matched.range(of: #"^[A-Z]{3}"#, options: .regularExpression) {
                    currency = String(matched[currMatch])
                }
            }
        }

        let recipient        = fields["N"] ?? fields["P"] ?? ""
        let account          = fields["R"] ?? ""
        let referenceNumber  = fields["RO"] ?? fields["RF"] ?? ""
        let paymentCode      = fields["SF"] ?? ""
        let paymentPurpose   = fields["S"] ?? ""

        if amount == 0 && recipient.isEmpty { return nil }

        return ParsedQrBill(
            recipient: recipient,
            amount: amount,
            currency: currency,
            account: account,
            referenceNumber: referenceNumber,
            paymentCode: paymentCode,
            paymentPurpose: paymentPurpose,
            description: buildDescription(recipient: recipient, purpose: paymentPurpose, reference: referenceNumber)
        )
    }

    // MARK: JSON
    private static func parseJson(_ raw: String) -> ParsedQrBill? {
        guard let data = raw.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        let amountVal = obj["amount"] ?? obj["iznos"] ?? obj["total"] ?? ""
        let amount = Double("\(amountVal)") ?? 0
        let recipient = (obj["recipient"] ?? obj["primalac"] ?? obj["name"] ?? "") as? String ?? ""
        if amount == 0 && recipient.isEmpty { return nil }
        let purpose = (obj["purpose"] ?? obj["svrha"] ?? "") as? String ?? ""
        let reference = (obj["reference"] ?? obj["pozivNaBroj"] ?? "") as? String ?? ""
        return ParsedQrBill(
            recipient: recipient,
            amount: amount,
            currency: (obj["currency"] ?? obj["valuta"] ?? "RSD") as? String ?? "RSD",
            account: (obj["account"] ?? obj["racun"] ?? "") as? String ?? "",
            referenceNumber: reference,
            paymentCode: (obj["paymentCode"] ?? obj["sifraPlacanja"] ?? "") as? String ?? "",
            paymentPurpose: purpose,
            description: buildDescription(recipient: recipient, purpose: purpose, reference: reference)
        )
    }

    // MARK: Plain text with amount pattern
    private static func parsePlainText(_ raw: String) -> ParsedQrBill? {
        let pattern = #"(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(?:RSD|din)?"#
        guard let range = raw.range(of: pattern, options: [.regularExpression, .caseInsensitive]) else { return nil }
        let matched = String(raw[range])
        let numStr = matched.components(separatedBy: CharacterSet(charactersIn: "RSDdin ").union(.whitespaces)).joined()
        let amount = Double(numStr.replacingOccurrences(of: ".", with: "").replacingOccurrences(of: ",", with: ".")) ?? 0
        if amount <= 0 { return nil }
        return ParsedQrBill(
            recipient: "",
            amount: amount,
            currency: "RSD",
            account: "",
            referenceNumber: "",
            paymentCode: "",
            paymentPurpose: "",
            description: "QR scan: \(raw.prefix(80))"
        )
    }

    // MARK: URL
    private static func parseUrl(_ raw: String) -> ParsedQrBill? {
        guard let url = URL(string: raw) else { return nil }
        let host = url.host ?? ""

        if host.contains("purs.gov.rs") || host.contains("suf.purs") {
            let vl = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                .queryItems?.first(where: { $0.name == "vl" })?.value ?? ""
            return decodeFiscalReceipt(vl)
        }

        return ParsedQrBill(
            recipient: host,
            amount: 0,
            currency: "RSD",
            account: "",
            referenceNumber: "",
            paymentCode: "",
            paymentPurpose: "",
            description: "QR: \(raw.prefix(80))"
        )
    }

    /// Decodes Serbian e-Fiskalizacija binary receipt (base64 `vl` param).
    private static func decodeFiscalReceipt(_ vl: String) -> ParsedQrBill {
        if let data = Data(base64Encoded: vl, options: .ignoreUnknownCharacters),
           data.count >= 41 {
            let bytes = [UInt8](data)
            let requestedBy = String(bytes: bytes[1..<9], encoding: .ascii) ?? ""
            let signedBy    = String(bytes: bytes[9..<17], encoding: .ascii) ?? ""
            let totalCounter = UInt32(bytes[17]) | UInt32(bytes[18]) << 8 | UInt32(bytes[19]) << 16 | UInt32(bytes[20]) << 24
            let amountLow  = UInt32(bytes[25]) | UInt32(bytes[26]) << 8 | UInt32(bytes[27]) << 16 | UInt32(bytes[28]) << 24
            let amountHigh = UInt32(bytes[29]) | UInt32(bytes[30]) << 8 | UInt32(bytes[31]) << 16 | UInt32(bytes[32]) << 24
            let totalAmount = (Double(amountHigh) * 4294967296.0 + Double(amountLow)) / 10000.0
            let receiptNumber = "\(requestedBy.trimmingCharacters(in: .controlCharacters))-\(signedBy.trimmingCharacters(in: .controlCharacters))-\(totalCounter)"
            return ParsedQrBill(
                recipient: "Фискални рачун",
                amount: (totalAmount * 100).rounded() / 100,
                currency: "RSD",
                account: "",
                referenceNumber: receiptNumber,
                paymentCode: "",
                paymentPurpose: "Fiscal receipt",
                description: "Fiscal receipt \(receiptNumber)"
            )
        }
        return ParsedQrBill(
            recipient: "Фискални рачун",
            amount: 0,
            currency: "RSD",
            account: "",
            referenceNumber: String(vl.prefix(30)),
            paymentCode: "",
            paymentPurpose: "Fiscal receipt",
            description: "Fiscal receipt"
        )
    }

    private static func buildDescription(recipient: String, purpose: String, reference: String) -> String {
        var parts: [String] = []
        if !recipient.isEmpty  { parts.append(recipient) }
        if !purpose.isEmpty    { parts.append(purpose) }
        if !reference.isEmpty  { parts.append("ref: \(reference)") }
        return parts.isEmpty ? "QR scanned bill" : parts.joined(separator: " - ")
    }
}
