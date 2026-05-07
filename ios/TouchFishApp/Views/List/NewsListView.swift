import SwiftUI

/// 中栏: 新闻列表 (类似 Apple Mail 的邮件列表)
struct NewsListView: View {
    let platform: Platform
    @EnvironmentObject var viewModel: AppViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Tab 选择器 (如果有子分类)
            if !platform.tabs.isEmpty {
                tabPicker
            }

            // 新闻列表
            newsListContent
        }
        .navigationTitle(platform.displayName)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    Task { await viewModel.refreshCurrentPlatform() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
    }

    // MARK: - Tab Picker

    private var tabPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(platform.tabs) { tab in
                    let isSelected = (viewModel.currentTab ?? platform.defaultTab) == tab.id
                    Button {
                        viewModel.changeTab(for: platform, tab: tab.id)
                    } label: {
                        Text(tab.name)
                            .font(.subheadline)
                            .fontWeight(isSelected ? .semibold : .regular)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(
                                isSelected
                                    ? platform.accentColor.opacity(0.15)
                                    : Color(.systemGray6)
                            )
                            .foregroundStyle(isSelected ? platform.accentColor : .secondary)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .background(Color(.systemBackground))
        .overlay(alignment: .bottom) {
            Divider()
        }
    }

    // MARK: - News List

    private var newsListContent: some View {
        Group {
            if viewModel.isLoadingList && viewModel.currentNewsList.isEmpty {
                loadingView
            } else if let error = viewModel.errorMessage, viewModel.currentNewsList.isEmpty {
                errorView(error)
            } else if viewModel.currentNewsList.isEmpty {
                emptyView
            } else {
                List {
                    ForEach(viewModel.currentNewsList) { item in
                        Button {
                            viewModel.selectNews(item)
                        } label: {
                            NewsRowView(item: item, accentColor: platform.accentColor)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .id("\(item.id)-\(item.isRead)")
                        .listRowBackground(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(viewModel.selectedNews?.id == item.id ? Color.gray.opacity(0.15) : Color.clear)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                        )
                        .listRowSeparator(.hidden)
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    await viewModel.refreshCurrentPlatform()
                }
                .overlay {
                    if viewModel.isLoadingList {
                        VStack {
                            ProgressView()
                                .padding(8)
                                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
                            Spacer()
                        }
                        .padding(.top, 8)
                    }
                }
            }
        }
    }

    // MARK: - State Views

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            Text("加载中...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40, weight: .light))
                .foregroundStyle(.orange)
            Text("加载失败")
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            Button("重试") {
                Task { await viewModel.refreshCurrentPlatform() }
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptyView: some View {
        VStack(spacing: 16) {
            Image(systemName: "tray")
                .font(.system(size: 40, weight: .light))
                .foregroundStyle(.quaternary)
            Text("暂无内容")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
