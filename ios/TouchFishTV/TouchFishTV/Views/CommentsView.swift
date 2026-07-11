import SwiftUI

struct CommentsView: View {
    let awemeId: String
    let onClose: () -> Void
    @EnvironmentObject var api: DouyinAPI
    @State private var comments: [Comment] = []
    @State private var cursor: Int = 0
    @State private var hasMore: Bool = true
    @State private var totalCount: Int = 0
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @FocusState private var closeButtonFocused: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // 头部标题
            HStack {
                Text(totalCount > 0 ? "\(totalCount) 条评论" : "暂无评论")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                if isLoading {
                    ProgressView()
                        .scaleEffect(0.6)
                }
                Button(action: onClose) {
                    Label("关闭评论", systemImage: "xmark.circle.fill")
                }
                .focused($closeButtonFocused)
            }
            .padding()
            .background(Color.white.opacity(0.05))

            if let errorMessage, !comments.isEmpty {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.red.opacity(0.7))
            }
            
            // 评论列表
            if comments.isEmpty && !isLoading {
                VStack {
                    Spacer()
                    Text(errorMessage ?? "还没有人评论")
                        .foregroundColor(.gray)
                        .font(.body)
                    if errorMessage != nil {
                        Button("重新加载") {
                            Task { await loadComments(isRefresh: true) }
                        }
                    }
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(comments) { comment in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(alignment: .center, spacing: 12) {
                                // 头像
                                AsyncImage(url: URL(string: comment.user?.avatar_thumb?.url_list?.first ?? "")) { img in
                                    img.resizable()
                                } placeholder: {
                                    Circle().fill(Color.gray.opacity(0.3))
                                }
                                .frame(width: 36, height: 36)
                                .clipShape(Circle())
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(comment.user?.nickname ?? "未知用户")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                        .bold()
                                    
                                    if let createTime = comment.create_time {
                                        Text(formatDate(createTime))
                                            .font(.system(size: 10))
                                            .foregroundColor(.gray.opacity(0.6))
                                    }
                                }
                            }
                            
                            Text(comment.text ?? "")
                                .font(.body)
                                .foregroundColor(.white)
                                .lineLimit(nil)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.leading, 48)
                            
                            // 子评论/回复
                            if let replies = comment.reply_comment, !replies.isEmpty {
                                VStack(alignment: .leading, spacing: 10) {
                                    ForEach(replies) { reply in
                                        VStack(alignment: .leading, spacing: 6) {
                                            HStack(spacing: 8) {
                                                AsyncImage(url: URL(string: reply.user?.avatar_thumb?.url_list?.first ?? "")) { img in
                                                    img.resizable()
                                                } placeholder: {
                                                    Circle().fill(Color.gray.opacity(0.3))
                                                }
                                                .frame(width: 24, height: 24)
                                                .clipShape(Circle())
                                                
                                                Text(reply.user?.nickname ?? "未知用户")
                                                    .font(.system(size: 12, weight: .bold))
                                                    .foregroundColor(.gray)
                                            }
                                            
                                            Text(reply.text ?? "")
                                                .font(.system(size: 13))
                                                .foregroundColor(.white.opacity(0.9))
                                                .padding(.leading, 32)
                                        }
                                        .padding(.vertical, 4)
                                    }
                                }
                                .padding(.all, 12)
                                .background(Color.white.opacity(0.03))
                                .cornerRadius(8)
                                .padding(.leading, 48)
                                .padding(.top, 4)
                            }
                        }
                        .padding(.vertical, 8)
                        .onAppear {
                            // 滚动到倒数第二条时，触发加载更多
                            if comment.id == comments.last?.id && hasMore && !isLoading {
                                Task {
                                    await loadMoreComments()
                                }
                            }
                        }
                    }
                }
            }
        }
        .frame(width: 450)
        .background(
            Color.black.opacity(0.5)
                .background(.ultraThinMaterial)
        )
        .cornerRadius(20)
        .padding(.vertical, 20)
        .padding(.trailing, 20)
        .onAppear {
            closeButtonFocused = true
            Task {
                await loadComments(isRefresh: true)
            }
        }
        .onExitCommand(perform: onClose)
    }
    
    private func loadComments(isRefresh: Bool) async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        let requestCursor = isRefresh ? 0 : cursor
        do {
            let (list, nextCursor, hasMoreComments, total) = try await api.getComments(awemeId: awemeId, cursor: requestCursor)
            await MainActor.run {
                if isRefresh {
                    self.comments = list
                } else {
                    self.comments.append(contentsOf: list)
                }
                self.cursor = nextCursor
                self.hasMore = hasMoreComments
                self.totalCount = total
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    private func loadMoreComments() async {
        await loadComments(isRefresh: false)
    }

    private func formatDate(_ timestamp: Int) -> String {
        let date = Date(timeIntervalSince1970: TimeInterval(timestamp))
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }
}
