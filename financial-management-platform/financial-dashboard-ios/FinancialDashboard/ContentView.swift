import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "chart.bar.fill")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Financial Dashboard")
                .font(.title2)
                .fontWeight(.semibold)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
