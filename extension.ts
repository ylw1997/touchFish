import * as vscode from 'vscode';
import * as path from 'path';
import * as superagent from 'superagent';

let extensionPath: string; // 插件路径
let panel: vscode.WebviewPanel | undefined = undefined; // 查看内容窗口
let ithomEmoji = ["爱你", "爱心", "挨揍", "暗中观察", "白鸡", "抱拳", "比心", "闭嘴", "不好惹的鸡", "不是吧", "不咋行", "不正经滑稽", "擦鼻血", "菜刀", "菜花", "超大的么么哒", "差强人意", "吃瓜", "吃惊", "呲牙笑", "大边框", "戴口罩", "大哭", "打脸", "大拇指", "弹出式摄像头", "蛋糕", "打你脸", "大眼卖萌", "对眼滑稽", "二哈", "烦", "非常惊讶", "愤怒", "佛系", "感兴趣", "给点吗", "狗头", "狗头不敢相信", "狗头斜眼", "害羞", "好的", "好的呀", "哈欠", "哈士奇", "嘿哈", "黑脸", "黑脸流汗", "红花", "坏笑", "滑稽", "滑稽鸡", "黄花", "惊讶", "囧", "拒绝", "考拉呆住", "可爱", "可爱滑稽", "酷", "苦脸", "骷髅", "苦中作乐", "蓝花", "老哥稳", "蜡烛", "流鼻血", "刘海屏", "流汗", "流汗滑稽", "路", "绿帽子", "马", "猫", "迷惑", "南", "南倒了", "念经", "你看我有在笑啊", "柠檬精", "你说啥", "牛", "哦吼", "胖次滑稽", "喷", "喷鼻血", "啤酒", "铺路", "强颜欢笑", "恰柠檬", "潜水", "庆祝", "拳头", "让我康康", "如花", "色", "胜利", "什么鬼", "手掌", "衰", "双挖孔屏", "水滴屏", "睡觉", "太阳", "摊手", "舔狗", "偷看", "吐", "托脸", "秃头", "兔子", "挖槽屏", "委屈", "委屈哭", "微笑", "握手", "我挺好的", "五瓣花", "捂脸笑哭", "相机", "小恶魔", "小黄鸡", "小鸡", "笑哭", "小拇指", "行吧行吧", "熊猫", "嘘", "药丸", "一本正经", "阴险笑", "幽灵", "右挖孔屏", "原谅他", "晕", "再见", "赞", "炸弹", "炸弹狂", "这个好这个好", "真服了", "猪", "专业团队", "左挖孔屏", "之家", "水库"]; // 之家表情包
let config: vscode.WorkspaceConfiguration; // 所有设置信息
let userHash: string; // 通行证 Cookie
let signReminder: boolean; // 签到提醒
let showPreviewImages: boolean; // 显示图片
let titleLength: number; // 显示图片
let imageWidth: number; // 显示图片
let showRelated: boolean; // 显示相关文章
let showComment: boolean; // 显示网友评论
let showAvatar: boolean; // 显示网友评论
let commentOrder: boolean; // 网友评论顺序
let commentOrderWord: string; // 网友评论顺序字典
let autoRefresh: number; // “最新”刷新间隔
let keyWords: string[]; // 关键词列表
let keysLength: number[]; // 关键词长度
let blockWords: string[]; // 屏蔽词列表
let period: number; // “热榜”榜单，仅在启动时从设置中读取
const periodDic = ['48', 'weekhot', 'weekcomment', 'month']; // “热榜”榜单字典
let showThumbs: boolean; // “热评”显示点赞数
let latestNewsId: number = 0; // “最新”最新消息标记，用于显示上次阅读位置
let lastReadId: number = 0; // “最新”最后阅读标记，用于显示上次阅读位置
const lastRead: vscode.TreeItem = {
	label: '上次阅读到这里，点击刷新',
	iconPath: new vscode.ThemeIcon('refresh'),
	command: { title: '刷新', command: 'ith2ome.latestRefresh' }
};

function refreshConfig() { // 刷新设置，仅在手动刷新时运行
	config = vscode.workspace.getConfiguration('ith2ome');
	userHash = <string>config.get('account');
	signReminder = <boolean>config.get('signReminder');
	showPreviewImages = <boolean>config.get('showPreviewImages');
	titleLength = Math.max(<number>config.get('titleLength'), 0);
	imageWidth = <number>config.get('imageWidth');
	showRelated = <boolean>config.get('showRelated');
	showComment = <boolean>config.get('showComment');
	showAvatar = <boolean>config.get('showAvatar');
	commentOrder = <boolean>config.get('commentOrder');
	commentOrderWord = commentOrder ? '早' : '新';
	autoRefresh = <number>config.get('autoRefresh');
	keyWords = <string[]>config.get('keyWords');
	keysLength = new Array(keyWords.length);
	for (let i in keyWords)
		{keysLength[i] = keyWords[i].length;}
	blockWords = <string[]>config.get('blockWords');
	showThumbs = <boolean>config.get('showThumbs');
}

function show(title: string): boolean { // 返回是否显示该条新闻
	for (let i in blockWords)
		{if (title.search(RegExp(blockWords[i], 'i')) != -1)
			{return false;}}
	return true;
}

function highlight(title: string): [number, number][] { // 返回该条新闻关键词位置
	let highlights: [number, number][] = [];
	let loc: number;
	for (let i in keyWords)
		{if ((loc = title.search(RegExp(keyWords[i], 'i'))) != -1)
			{highlights.push([loc, loc + keysLength[i]]);}}
	return highlights;
}

function linkCheck(url: string): vscode.Uri { // 检查链接是否以 https:// 开始
	return vscode.Uri.parse(url.substring(0, 5) == 'https' ? url : 'https://www.ithome.com' + url);
}

class ith2omeItem extends vscode.TreeItem { // 在 TreeItem 基础上增加 shareInfo 用于复制链接
	shareInfo?: string;
}

class ith2omeShowContent implements vscode.Command { // 在 VSCode 中查看的命令，用于“最新”、“热榜”与“热评”
	title = '查看内容';
	command = 'ith2ome.showContent';
	arguments: string[];
	constructor(title: string, time: string, id: string) {
		this.arguments = [title, time, id];
	}
}

function newsFormat(news: any, icon: string): ith2omeItem {
	let time = new Date(news.postdate).toLocaleString('zh-CN');
	let highlights = highlight(news.title);
	return {
		label: { highlights: highlights, label: news.title },
		contextValue: 'ith2ome.article',
		iconPath: new vscode.ThemeIcon(icon.length == 7 && highlights.length ? 'lightbulb' : icon),
		id: icon + news.newsid,
		description: time,
		resourceUri: linkCheck(news.url),
		tooltip: new vscode.MarkdownString(`**${news.title}**\n\n` + (showPreviewImages ? `![封面图](${news.image})` : '') + `\n\n*${time}*\n\n${news.description}\n\n点击数：${news.hitcount}｜评论数：${news.commentcount}`),
		command: new ith2omeShowContent(news.title, time, news.newsid),
		shareInfo: `标题：${news.title}\n时间：${time}\n内容：${news.description}\n点击数：${news.hitcount}｜评论数：${news.commentcount}\n`
	};
}

function numberFormat(num: number): string {
	return num >= 10000 ? (num / 10000).toFixed(1).toString() + '万' : num.toString();
}

interface commentM {
	C: string, // 内容
	N: string, // 昵称
	Ui: number, // ID
	Y: string,
	T: string, // 时间
	S: number, // 支持
	A: number, // 反对
	Ta: string,
	R: number,
	Cl: number,
	Ir: boolean,
	SF: string, // 楼层
	Ul: number, // 等级
	Tl: number,
	Rl: number,
	PUi: number,
	M: number,
	Vip: number,
	Cs: number,
	HeadImg: string, // 头像
	WT: string, // 简化时间
	ClName: string, // 设备名
	UserIndexUrl: string, // 用户页面
	UserMesClass: string
}

interface commentJSON {
	Hfc: number, // 回复数
	M: commentM, // 评论
	R: commentM[] // 回复
}

function commentItemFormat(HeadImg: string, Ui: number, N: string, Ul: number, SF: string, WT: string, C: string, S: number, A: number, Hfc: number = -1): string { // 生成评论
	for (let i in ithomEmoji)
		{C = C.replace(RegExp('\\[' + ithomEmoji[i] + '\\]', 'g'), '<img style="width:1.3em;vertical-align:text-bottom" src=\'' + panel!.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'img', 'ithomEmoji', i + '.svg'))) + '\'>');}
	return '<li style="margin:1em 0em">' + (showAvatar ? `<img style="float:left;height:4em;width:4em;border-radius:50%" src="${HeadImg}" onerror="this.src='${panel!.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'img', 'noavatar.png')))}';this.onerror=null">` : '') + `<div style="margin-left:${showAvatar ? 5 : 0}em"><strong title="软媒通行证数字ID：${Ui}" style="font-size:1.2em">${N}</strong><sup>Lv.${Ul}</sup><div style="float:right">${SF} @ ${WT}</div><br>${C}<br>${Hfc > 0 ? `<span style="margin-right:3em">回复(${Hfc})</span>` : ''}<span style="color:#28BD98;margin-right:3em">支持(${S})</span><span style="color:#FF6F6F">反对(${A})</span></div>`;
}

function commentFormat(commentItem: commentJSON[], commentContent: string): string { // 评论JSON生成列表
	if (commentItem.length == 0)
		{return '';}
	for (let i in commentItem) {
		commentContent += commentItemFormat(commentItem[i].M.HeadImg, commentItem[i].M.Ui, commentItem[i].M.N, commentItem[i].M.Ul, commentItem[i].M.SF, commentItem[i].M.WT, commentItem[i].M.C, commentItem[i].M.S, commentItem[i].M.A, commentItem[i].Hfc + commentItem[i].R?.length);
		if (commentItem[i].R?.length > 0) {
			commentContent += '<ul>';
			for (let j in commentItem[i].R)
				{commentContent += commentItemFormat(commentItem[i].R[j].HeadImg, commentItem[i].R[j].Ui, commentItem[i].R[j].N, commentItem[i].R[j].Ul, commentItem[i].R[j].SF, commentItem[i].R[j].WT, commentItem[i].R[j].C, commentItem[i].R[j].S, commentItem[i].R[j].A) + '</li>';}
			commentContent += '</ul>';
		}
		commentContent += '</li>';
	}
	return '<hr>' + commentContent + '</ul>';
}

class contentProvider implements vscode.TreeDataProvider<vscode.TreeItem> { // 为 View 提供内容
	private update = new vscode.EventEmitter<vscode.TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
	private list: ith2omeItem[] = []; // 项目列表
	private mode: number; // 工作模式，0 为“通行证”，1 为“最新”，2 为“热榜”，3 为“热评”
	private refreshTimer: NodeJS.Timeout | undefined; // 自动刷新计时器

	constructor(_mode: number) {
		this.mode = _mode;
		this.refresh();
	}
	refresh(refreshType: number = 0) { // 0 为手动刷新，1 为自动刷新，其余为加载更多的时间戳（仅用于“最新”）
		if (this.refreshTimer) // 若为手动刷新
			{clearTimeout(this.refreshTimer);} // 清除下一次自动刷新计时器
		if (refreshType < 2)
			{this.list = [];} // 清除项目列表
		if (this.mode == 0) { // “通行证”
			if (userHash == '') { // Cookie 为空
				this.list = [{
					label: '使用 Cookie 登录通行证',
					iconPath: new vscode.ThemeIcon('log-in'),
					description: '方法见 README',
					command: { title: '登录', command: 'ith2ome.login' }
				}];
				this.update.fire();
			}
			else {
				superagent.get(`https://my.ruanmei.com/api/User/Get?userHash=${userHash}&extra`).end((err, res) => {
					if (!res.body.ok) { // 失败
						userHash = '';
						config.update('account', '', true);
						vscode.window.showErrorMessage('登录失败，请检查 Cookie。');
						this.refresh();
						return;
					}
					let userInfo = res.body.userinfo;
					this.list = [{
						label: `${userInfo.nickname}，您好！您已连续登录 ${userInfo.conldays} 天`,
						iconPath: new vscode.ThemeIcon('account'),
						contextValue: 'ith2ome.account'
					}, {
						label: `目前等级 ${userInfo.rank}，经验值 ${userInfo.exp}，需 ${userInfo.remainexp} 经验升级`,
						iconPath: new vscode.ThemeIcon('star-empty')
					}];
					this.update.fire();
					superagent.get('https://my.ruanmei.com/api/usersign/getsigninfo?userHash=' + userHash).end((err2, res2) => {
						if (signReminder && !res2.body.issign)
							{vscode.window.showInformationMessage(`今日尚未签到，可获得 ${res2.body.coin} 金币～`);}
						this.list.push({
							label: (res2.body.issign ? `今日已签到，` : '今日未签到，可') + `获得 ${res2.body.coin} 金币，累计金币数：${res2.body.totalcoin}`,
							iconPath: new vscode.ThemeIcon(res2.body.issign ? 'pass' : 'error')
						});
						this.list.push({
							label: `连续签到：${res2.body.cdays} 天，累计签到：${res2.body.mdays} 天`,
							iconPath: new vscode.ThemeIcon('calendar')
						});
						this.update.fire();
					});
				});
				this.refreshTimer = setTimeout(() => { this.refresh(); }, 3600000); // 设置自动刷新时间
			}
		}
		else if (this.mode == 1) { // “最新”
			if (refreshType < 2) {
				if (lastReadId == 0 || refreshType == 0) // 仅在初始化和手动刷新时更新最后阅读标记
					{lastReadId = latestNewsId;}
				else if (lastReadId < 0) // lastReadId < 0 表示最后阅读标记已插入，刷新时需设为正
					{lastReadId = -lastReadId;}
				superagent.get('https://api.ithome.com/json/newslist/news').end((err, res) => {
					let topList = res.body.toplist;
					for (let i in topList)
						{if (show(topList[i].title))
							{this.list.push(newsFormat(topList[i], 'pinned'));}}
					let newsList = res.body.newslist;
					for (let i in newsList) {
						let orderTime = new Date(newsList[i].orderdate).getTime();
						latestNewsId = Math.max(latestNewsId, orderTime);
						if (orderTime <= lastReadId) {
							if (i != '0')
								{this.list.push(lastRead);}
							lastReadId = -lastReadId;
						}
						if (show(newsList[i].title))
							{this.list.push(newsFormat(newsList[i], newsList[i].aid ? 'tag' : 'preview'));}
					}
					this.list.push({
						label: '加载更多数据',
						iconPath: new vscode.ThemeIcon('eye'),
						command: { title: '加载更多数据', command: 'ith2ome.latestRefresh', arguments: [new Date(newsList[newsList.length - 1].orderdate).getTime()] }
					});
					this.update.fire();
				});
			}
			else { // 加载更多数据
				this.list.pop();
				superagent.get('https://m.ithome.com/api/news/newslistpageget?ot=' + refreshType).end((err, res) => {
					let newsList = res.body.Result;
					for (let i in newsList) {
						if (lastReadId > 0 && new Date(newsList[i].orderdate).getTime() <= lastReadId) {
							this.list.push(lastRead);
							lastReadId = -lastReadId;
						}
						if (show(newsList[i].title))
							{this.list.push(newsFormat(newsList[i], newsList[i].url.search('lapin') != -1 ? 'tag' : 'preview'));}
					}
					this.list.push({
						label: '加载更多数据',
						iconPath: new vscode.ThemeIcon('eye'),
						command: { title: '加载更多数据', command: 'ith2ome.latestRefresh', arguments: [new Date(newsList[newsList.length - 1].orderdate).getTime()] }
					});
					this.update.fire();
				});
			}
			if (autoRefresh > 0)
				{this.refreshTimer = setTimeout(() => { this.refresh(1); }, autoRefresh * 1000);} // 设置自动刷新时间
		}
		else if (this.mode == 2) { // “热榜”
			superagent.get('https://api.ithome.com/json/newslist/rank').end((err, res) => {
				let rankList = res.body['channel' + periodDic[period] + 'rank'];
				for (let i in rankList)
					{this.list.push(newsFormat(rankList[i], 'flame'));}
				this.update.fire();
			});
			this.refreshTimer = setTimeout(() => { this.refresh(); }, 86400000); // 设置自动刷新时间
		}
		else if (this.mode == 3) { // “热评”
			superagent.get('http://cmt.ithome.com/api/comment/hotcommentlist/').end((err, res) => {
				let commentList = res.body.content.commentlist;
				for (let i in commentList) {
					let time = new Date(commentList[i].Comment.T).toLocaleString('zh-CN');
					let locLength = commentList[i].Comment.Y.length;
					let user = commentList[i].Comment.N + (locLength > 6 ? ` @ ${commentList[i].Comment.Y.substring(4, locLength - 2)}` : '');
					this.list.push({
						label: (showThumbs ? `${commentList[i].Comment.S} | ` : '') + commentList[i].Comment.C.replace(RegExp('[\n]+', 'g'), ' '),
						contextValue: 'ith2ome.article',
						iconPath: new vscode.ThemeIcon('thumbsup'),
						id: 'comment' + commentList[i].Comment.Ci,
						description: time,
						resourceUri: linkCheck(commentList[i].News.NewsLink),
						tooltip: new vscode.MarkdownString(`*${commentList[i].Comment.C.replace(RegExp('[\n]+', 'g'), '*\n\n*')}*\n\n**${commentList[i].News.NewsTitle}**\n\n*${time}*\n\n${user}`),
						command: new ith2omeShowContent(commentList[i].News.NewsTitle, '', commentList[i].News.NewsId),
						shareInfo: `${commentList[i].Comment.C}\n\n标题：${commentList[i].News.NewsTitle}\n时间：${time}\n用户：${user}\n`
					});
				}
				this.update.fire();
			});
			this.refreshTimer = setTimeout(() => { this.refresh(); }, 86400000); // 设置自动刷新时间
		}
	}
	getChildren(element?: vscode.TreeItem): vscode.TreeItem[] { // 获取项目列表
		if (element)
			{return [];}
		return this.list;
	}
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem { // 获取项目
		return element;
	}
}

export function activate(context: vscode.ExtensionContext) {
	extensionPath = context.extensionPath;
	refreshConfig();
	period = <number>config.get('defaultPeriod'); // 仅在启动时从设置中读取
	let account = new contentProvider(0);
	let latest = new contentProvider(1);
	let hot = new contentProvider(2);
	let comment = new contentProvider(3);
	vscode.window.registerTreeDataProvider('ith2ome.account', account);
	vscode.window.registerTreeDataProvider('ith2ome.latest', latest);
	vscode.window.registerTreeDataProvider('ith2ome.hot', hot);
	vscode.window.registerTreeDataProvider('ith2ome.comment', comment);
	context.subscriptions.push(
		vscode.commands.registerCommand('ith2ome.login', () => { // 登录通行证
			vscode.window.showInputBox({
				ignoreFocusOut: true,
				placeHolder: '请在此处输入您的 Cookie',
				prompt: '获取 Cookie 的方法可查看插件说明'
			}).then((hash = '') => {
				userHash = hash;
				config.update('account', hash, true).then(() => {
					account.refresh();
				});
			});
		}),
		vscode.commands.registerCommand('ith2ome.logout', () => { // 退出通行证
			userHash = '';
			config.update('account', '', true).then(() => {
				vscode.window.showInformationMessage('退出成功！');
				account.refresh();
			});
		}),
		vscode.commands.registerCommand('ith2ome.accountRefresh', () => { // 刷新“通行证”
			refreshConfig();
			account.refresh();
		}),
		vscode.commands.registerCommand('ith2ome.showContent', (title: string, time: string, id: number) => { // 显示新闻内容
			if (panel) { // 若标签页已存在
				panel.reveal(vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined);
				panel.title = title.length > titleLength ? title.substring(0, titleLength) + '…' : title;
			}
			else { // 若标签页未开启或已关闭
				panel = vscode.window.createWebviewPanel('ith2ome', title.length > titleLength ? title.substring(0, titleLength) + '…' : title, { preserveFocus: true, viewColumn: vscode.ViewColumn.One }, { enableScripts: true });
				panel!.iconPath = vscode.Uri.file(path.join(extensionPath, 'img/icon.svg'));
			}
			superagent.get('https://api.ithome.com/json/newscontent/' + id).end((errNews, resNews) => { // 获取新闻内容
				let videosList = resNews.body.detail.match(RegExp('<iframe class="ithome_video bilibili".*?</iframe>', 'g')); // 匹配B站视频
				let BVList: String[] = [];
				for (let i in videosList) {
					let BVID = videosList[i].match(RegExp('(?<=bvid=)[0-9a-z]+', 'i'));
					if (BVID) {
						BVList.push(BVID);
						resNews.body.detail = resNews.body.detail.replace(RegExp('<iframe class="ithome_video bilibili".*?</iframe>'), '<div id="' + BVID + '" align="center"><h4><a href="https://www.bilibili.com/video/' + BVID + '">哔哩哔哩视频：信息加载中</a></h4></div>');
					}
				}
				panel!.webview.html = '<head><style>' + (resNews.body.btheme ? 'body{filter:grayscale(100%)}' : '') + (imageWidth > 0 ? `img{width:${imageWidth}px}` : '') + `</style></head><h1>${title}</h1><h3>新闻源：${resNews.body.newssource}（${resNews.body.newsauthor}）｜责编：${resNews.body.z}</h3><h4>${time}</h4>${imageWidth <= 0 ? resNews.body.detail.replace(RegExp('<img.*?>', 'g'), '#图片已屏蔽#') : resNews.body.detail}`;
				for (let i in BVList)
					{superagent.get('https://api.bilibili.com/x/web-interface/view?bvid=' + BVList[i]).end((errVideo, resVideo) => { // 加载B站视频信息
						panel!.webview.html = panel!.webview.html.replace(RegExp('<div id="' + BVList[i] + '.*?</div>'), '<div align="center" style="border:solid#FB7299"><h4><a href="https://www.bilibili.com/video/' + BVList[i] + `">哔哩哔哩视频：${resVideo.body.data.title}</a></h4>` + (imageWidth > 0 ? `<img src="${resVideo.body.data.pic}" alt="哔哩哔哩视频封面">` : '') + `<table style="border-spacing:1.5em 0.5em"><tr><th>观看</th><th>弹幕</th><th>评论</th><th>点赞</th><th>投币</th><th>收藏</th><th>转发</th><th>发布时间</th></tr><tr><td>${numberFormat(resVideo.body.data.stat.view)}</td><td>${numberFormat(resVideo.body.data.stat.danmaku)}</td><td>${numberFormat(resVideo.body.data.stat.reply)}</td><td>${numberFormat(resVideo.body.data.stat.like)}</td><td>${numberFormat(resVideo.body.data.stat.coin)}</td><td>${numberFormat(resVideo.body.data.stat.favorite)}</td><td>${numberFormat(resVideo.body.data.stat.share)}</td><td>${new Date(resVideo.body.data.pubdate * 1000).toLocaleString('zh-CN')}</td></tr></table><table style="text-align:center;border-spacing:2em 0em"><tr><td>` + (imageWidth > 0 ? `<img style="height:6em;width:6em;border-radius:50%" src="${resVideo.body.data.owner.face}"></br>` : '') + `<strong>${resVideo.body.data.owner.name}</strong></td><td><p style="white-space:pre-wrap;text-align:left">${resVideo.body.data.desc}</p></td></tr></table></div>`);
					});};
				if (showRelated) { // 显示相关文章
					panel!.webview.html += `<hr><h2>相关文章</h2>`;
					superagent.get(`https://api.ithome.com/json/tags/0${Math.floor(id / 1000)}/${id}.json`).responseType('text').end((errRelate, resRelate) => {
						let text = '<h2>相关文章</h2><ul>';
						let relateList = JSON.parse(resRelate.body.toString().substring(16));
						for (let i in relateList)
							{text += `<li><a href="${relateList[i].url}">${relateList[i].newstitle}</a></li>`;}
						panel!.webview.html = panel!.webview.html.replace('<h2>相关文章</h2>', text + '</ul>');
					});
				}
				if (showComment) { // 显示网友评论
					panel!.webview.html += '<hr><h2>评论区加载中</h2>';
					superagent.get(`https://m.ithome.com/html/${id % 1000000}.htm`).end((errMobile, resMobile) => {
						let NewsIDDes = resMobile.text.match(RegExp('(?<=NewsIDDes:")[0-9a-f]{16}', 'g'));
						superagent.get(`https://m.ithome.com/api/comment/newscommentlistget?NewsID=${NewsIDDes}${commentOrder ? '&Latest=1' : ''}`).end((errComment, resComment) => {
							let commentJSON = JSON.parse(resComment.text).Result;
							panel!.webview.html = panel!.webview.html.replace('<hr><h2>评论区加载中</h2>', commentJSON ? commentFormat(commentJSON.Tlist, '<h2>置顶评论</h2><ul>') + commentFormat(commentJSON.Hlist, '<h2>热门评论</h2><ul>') + commentFormat(commentJSON.Clist, '<h2>最' + commentOrderWord + '评论</h2><ul>') : '<hr><h2>暂无评论</h2>');
						});
					});
				}
			});
			panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
		}),
		vscode.commands.registerCommand('ith2ome.share', (item: ith2omeItem) => { // 分享新闻
			vscode.env.clipboard.writeText(item.shareInfo! + item.resourceUri).then(() => {
				vscode.window.showInformationMessage('新闻复制成功！');
			});
		}),
		vscode.commands.registerCommand('ith2ome.openBrowser', (item: vscode.TreeItem) => { // 在浏览器中查看
			vscode.commands.executeCommand('vscode.open', item.resourceUri);
		}),
		vscode.commands.registerCommand('ith2ome.latestRefresh', (refreshType: number) => { // 刷新“最新”
			refreshConfig();
			latest.refresh(refreshType);
		}),
		vscode.commands.registerCommand('ith2ome.hotRefresh', () => { // 刷新“热榜”
			refreshConfig();
			hot.refresh();
		}),
		vscode.commands.registerCommand('ith2ome.daily', () => { // “热榜”切换为日榜
			period = 0;
			hot.refresh();
		}),
		vscode.commands.registerCommand('ith2ome.weekly', () => { // “热榜”切换为周榜
			period = 1;
			hot.refresh();
		}),
		vscode.commands.registerCommand('ith2ome.comment', () => { // “热榜”切换为热评
			period = 2;
			hot.refresh();
		}),
		vscode.commands.registerCommand('ith2ome.monthly', () => { // “热榜”切换为月榜
			period = 3;
			hot.refresh();
		}),
		vscode.commands.registerCommand('ith2ome.commentRefresh', () => {  // 刷新“热评”
			refreshConfig();
			comment.refresh();
		})
	);
}

export function deactivate() { }
