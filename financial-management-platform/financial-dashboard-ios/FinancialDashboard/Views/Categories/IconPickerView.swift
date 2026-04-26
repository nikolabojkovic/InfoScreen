import SwiftUI

// MARK: - Icon data (mirrors Angular app's icon list)

struct IconEntry: Identifiable {
    let id = UUID()
    let emoji: String
    let label: String
}

let categoryIcons: [IconEntry] = [
    // Housing
    .init(emoji: "🏠", label: "home house"), .init(emoji: "🏡", label: "house garden"),
    .init(emoji: "🏢", label: "office building apartment"), .init(emoji: "🚪", label: "door entrance"),
    .init(emoji: "🛋️", label: "couch sofa living room"), .init(emoji: "🪴", label: "plant potted indoor"),
    .init(emoji: "🛁", label: "bathtub bath"), .init(emoji: "🚿", label: "shower bathroom"),
    .init(emoji: "🛏️", label: "bed bedroom sleep"), .init(emoji: "🪟", label: "window"),
    // Shopping
    .init(emoji: "🛒", label: "shopping cart groceries"), .init(emoji: "🛍️", label: "shopping bag retail"),
    .init(emoji: "👟", label: "shoes sneakers footwear"), .init(emoji: "👗", label: "dress clothing fashion"),
    .init(emoji: "👜", label: "handbag purse bag"), .init(emoji: "💍", label: "ring jewelry accessories"),
    .init(emoji: "💄", label: "lipstick makeup cosmetics"), .init(emoji: "🧴", label: "lotion personal care hygiene"),
    .init(emoji: "🧹", label: "broom cleaning household"), .init(emoji: "🧺", label: "basket laundry"),
    .init(emoji: "🧻", label: "toilet paper household"), .init(emoji: "🪒", label: "razor shaving grooming"),
    .init(emoji: "🧼", label: "soap hygiene cleaning"), .init(emoji: "🪥", label: "toothbrush dental hygiene"),
    .init(emoji: "💈", label: "barber hair salon"),
    // Transport
    .init(emoji: "🚗", label: "car vehicle driving"), .init(emoji: "🚕", label: "taxi cab transport"),
    .init(emoji: "🚌", label: "bus public transport"), .init(emoji: "🚂", label: "train railway transport"),
    .init(emoji: "✈️", label: "airplane flight travel"), .init(emoji: "🛳️", label: "ship cruise boat"),
    .init(emoji: "🚲", label: "bicycle bike cycling"), .init(emoji: "🛵", label: "scooter moped"),
    .init(emoji: "🚴", label: "cycling bike sport"), .init(emoji: "⛽", label: "fuel gas petrol"),
    .init(emoji: "🅿️", label: "parking car"), .init(emoji: "🛞", label: "tire wheel car"),
    // Food & Drink
    .init(emoji: "🍔", label: "burger fast food"), .init(emoji: "🍕", label: "pizza food"),
    .init(emoji: "🌮", label: "taco mexican food"), .init(emoji: "🍜", label: "noodles ramen asian food"),
    .init(emoji: "🍣", label: "sushi japanese food"), .init(emoji: "🥗", label: "salad healthy food"),
    .init(emoji: "🍎", label: "apple fruit healthy"), .init(emoji: "🥑", label: "avocado healthy food"),
    .init(emoji: "🍷", label: "wine drinks alcohol"), .init(emoji: "☕", label: "coffee hot drink cafe"),
    .init(emoji: "🍺", label: "beer drinks alcohol"), .init(emoji: "🍰", label: "cake dessert sweets"),
    .init(emoji: "🍫", label: "chocolate sweets candy"), .init(emoji: "🍞", label: "bread bakery"),
    .init(emoji: "🥩", label: "meat steak food"), .init(emoji: "🥦", label: "broccoli vegetables healthy"),
    .init(emoji: "🍳", label: "egg cooking breakfast"),
    // Health & Medical
    .init(emoji: "💊", label: "pill medicine medication"), .init(emoji: "🏥", label: "hospital medical health"),
    .init(emoji: "🩺", label: "stethoscope doctor health"), .init(emoji: "💉", label: "syringe injection vaccine"),
    .init(emoji: "🩹", label: "bandage first aid"), .init(emoji: "🦷", label: "tooth dental dentist"),
    .init(emoji: "👁️", label: "eye vision optician"), .init(emoji: "🧘", label: "yoga meditation wellness"),
    .init(emoji: "🏋️", label: "gym weights fitness"), .init(emoji: "🧠", label: "brain mental health"),
    // Entertainment
    .init(emoji: "🎮", label: "gaming video games console"), .init(emoji: "🎭", label: "theater arts performance"),
    .init(emoji: "🎵", label: "music notes audio"), .init(emoji: "🎸", label: "guitar music instrument"),
    .init(emoji: "🎬", label: "cinema movie film"), .init(emoji: "📺", label: "tv television streaming"),
    .init(emoji: "🎯", label: "target darts sport"), .init(emoji: "🎲", label: "dice board game"),
    .init(emoji: "⚽", label: "football soccer sport"), .init(emoji: "🏀", label: "basketball sport"),
    .init(emoji: "🎾", label: "tennis sport"), .init(emoji: "🏊", label: "swimming pool sport"),
    .init(emoji: "🎨", label: "art painting creative"), .init(emoji: "🏖️", label: "beach vacation holiday"),
    .init(emoji: "⛷️", label: "skiing winter sport"), .init(emoji: "🎤", label: "microphone singing karaoke"),
    // Finance
    .init(emoji: "💰", label: "money bag savings wealth"), .init(emoji: "💵", label: "cash banknotes money"),
    .init(emoji: "💳", label: "credit card payment"), .init(emoji: "📈", label: "chart growth investment stocks"),
    .init(emoji: "🏦", label: "bank finance"), .init(emoji: "💸", label: "cash spending money"),
    .init(emoji: "🪙", label: "coin money change"), .init(emoji: "👛", label: "wallet purse money"),
    .init(emoji: "📉", label: "chart decline loss"), .init(emoji: "💎", label: "diamond gem luxury"),
    // Education
    .init(emoji: "📚", label: "books reading education"), .init(emoji: "🎓", label: "graduation university study"),
    .init(emoji: "✏️", label: "pencil writing school"), .init(emoji: "📝", label: "memo note writing"),
    .init(emoji: "📖", label: "open book reading"), .init(emoji: "🔬", label: "microscope science lab"),
    .init(emoji: "🔭", label: "telescope astronomy science"), .init(emoji: "🧪", label: "test tube chemistry lab"),
    // Technology
    .init(emoji: "💻", label: "laptop computer technology"), .init(emoji: "📱", label: "phone mobile smartphone"),
    .init(emoji: "🖥️", label: "desktop computer monitor"), .init(emoji: "⌨️", label: "keyboard typing computer"),
    .init(emoji: "🔌", label: "plug electricity power"), .init(emoji: "💾", label: "disk storage data"),
    .init(emoji: "🤖", label: "robot ai technology"), .init(emoji: "📡", label: "satellite antenna signal"),
    // Nature
    .init(emoji: "🌿", label: "plant nature green"), .init(emoji: "🌺", label: "flower nature garden"),
    .init(emoji: "🌲", label: "tree forest nature"), .init(emoji: "🌊", label: "wave ocean sea water"),
    .init(emoji: "☀️", label: "sun sunshine weather"), .init(emoji: "❄️", label: "snowflake winter cold"),
    .init(emoji: "⛰️", label: "mountain hiking outdoors"), .init(emoji: "🌙", label: "moon night sleep"),
    .init(emoji: "🌍", label: "globe earth world travel"), .init(emoji: "🌈", label: "rainbow weather colors"),
    // Animals
    .init(emoji: "🐶", label: "dog pet animal"), .init(emoji: "🐈", label: "cat pet animal"),
    .init(emoji: "🐠", label: "fish aquarium pet"), .init(emoji: "🐾", label: "paw print pet animal"),
    .init(emoji: "🐇", label: "rabbit bunny pet"), .init(emoji: "🐦", label: "bird animal nature"),
    // Family
    .init(emoji: "👶", label: "baby child family"), .init(emoji: "👧", label: "girl child family"),
    .init(emoji: "👦", label: "boy child family"), .init(emoji: "👴", label: "elderly senior family"),
    .init(emoji: "👨‍👩‍👧", label: "family parents children"),
    // Tools
    .init(emoji: "🔧", label: "wrench repair tools"), .init(emoji: "🔨", label: "hammer tools repair"),
    .init(emoji: "📦", label: "box package delivery"), .init(emoji: "💼", label: "briefcase work business"),
    .init(emoji: "🗂️", label: "folder files organisation"), .init(emoji: "📋", label: "clipboard tasks list"),
    .init(emoji: "📊", label: "bar chart data report"), .init(emoji: "🪛", label: "screwdriver repair tools"),
    .init(emoji: "🧰", label: "toolbox repair diy"), .init(emoji: "🏗️", label: "construction building work"),
    // Misc
    .init(emoji: "🎁", label: "gift present birthday"), .init(emoji: "🔑", label: "key lock security"),
    .init(emoji: "📰", label: "newspaper news reading"), .init(emoji: "⚡", label: "lightning electricity bolt"),
    .init(emoji: "⭐", label: "star favourite rating"), .init(emoji: "🔔", label: "bell notification alert"),
    .init(emoji: "🏆", label: "trophy award achievement"), .init(emoji: "🔥", label: "fire hot trending"),
    .init(emoji: "🔒", label: "lock security private"), .init(emoji: "📷", label: "camera photography"),
    .init(emoji: "☂️", label: "umbrella rain weather"), .init(emoji: "🎀", label: "ribbon bow gift decoration"),
]

// MARK: - Icon Picker Sheet

struct IconPickerView: View {
    @Binding var selectedIcon: String
    @Environment(\.dismiss) private var dismiss

    @State private var search = ""

    private let columns = Array(repeating: GridItem(.adaptive(minimum: 44), spacing: 4), count: 8)

    private var filtered: [IconEntry] {
        let q = search.trimmingCharacters(in: .whitespaces).lowercased()
        return q.isEmpty ? categoryIcons : categoryIcons.filter { $0.label.contains(q) }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.secondary)
                    TextField("Search icons…", text: $search)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                .padding(10)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 8)

                if filtered.isEmpty {
                    ContentUnavailableView("No icons found", systemImage: "magnifyingglass")
                        .frame(maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 4) {
                            ForEach(filtered) { entry in
                                Button {
                                    selectedIcon = entry.emoji
                                    dismiss()
                                } label: {
                                    Text(entry.emoji)
                                        .font(.title2)
                                        .frame(width: 44, height: 44)
                                        .background(
                                            selectedIcon == entry.emoji
                                                ? Color.accentColor.opacity(0.2)
                                                : Color.clear
                                        )
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(
                                                    selectedIcon == entry.emoji
                                                        ? Color.accentColor
                                                        : Color.clear,
                                                    lineWidth: 2
                                                )
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.bottom, 16)
                    }
                }
            }
            .navigationTitle("Choose Icon")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
