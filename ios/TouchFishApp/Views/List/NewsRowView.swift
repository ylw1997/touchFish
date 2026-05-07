import SwiftUI

/// 新闻列表行视图 (类似 Apple Mail 的邮件行)
struct NewsRowView: View {
    let item: NewsItem
    let accentColor: Color

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // 未读指示圆点
            Circle()
                .fill(item.isRead ? Color.clear : accentColor)
                .frame(width: 9, height: 9)
                .padding(.top, 6)

            VStack(alignment: .leading, spacing: 4) {
                // 标题
                Text(item.title)
                    .font(.system(size: 15, weight: item.isRead ? .regular : .semibold))
                    .foregroundStyle(item.isRead ? .secondary : .primary)
                    .lineLimit(2)

                // 元信息
                HStack(spacing: 8) {
                    if let author = item.author, !author.isEmpty {
                        Text(author)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let time = item.time, !time.isEmpty {
                        Text(time)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    if let category = item.category, !category.isEmpty {
                        Text(category)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(accentColor.opacity(0.1))
                            .foregroundStyle(accentColor)
                            .clipShape(Capsule())
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}
