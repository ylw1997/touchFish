/*
 * @Author: YangLiwei
 * @Date: 2022-05-24 16:18:31
 * @LastEditTime: 2025-11-10 13:51:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\commands.ts
 * @Description:
 */
// 注册命令
import { commands } from "vscode";
import { NgaProvider } from "../Providers/ngaProvider";
import { setConfigByKey } from "../core/config";
import * as vscode from "vscode";
import { showInfo } from "../utils/errorMessage";
import { V2exProvider } from "../Providers/v2exProvider";
import { HupuProvider } from "../Providers/hupuProvider";

// 打开设置
export const openSetting = commands.registerCommand(
  "touchfish.openConfigPage",
  () => {
    commands.executeCommand(
      "workbench.action.openSettings",
      "@ext:ylw.touchfish"
    );
  }
);

// 更改v2ex tab
export const changeV2exTab = (provider: V2exProvider) => {
  return vscode.commands.registerCommand("v2ex.changeTab", async () => {
    const tab = await vscode.window.showQuickPick([
      { label: "全部", description: "all" },
      { label: "技术", description: "tech" },
      { label: "创意", description: "creative" },
      { label: "好玩", description: "play" },
      { label: "Apple", description: "apple" },
      { label: "酷工作", description: "jobs" },
      { label: "交易", description: "deals" },
      { label: "城市", description: "city" },
      { label: "问与答", description: "qna" },
      { label: "最热", description: "hot" },
      { label: "R2", description: "r2" },
    ]);
    if (tab) {
      await provider.getData(tab.description);
      await setConfigByKey("v2exTab", tab.description);
      // await vscode.commands.executeCommand('v2ex.refresh');
      await showInfo(`v2ex 切换为 ${tab.label}`);
    }
  });
};

// 更改v2ex tab
export const changeHupuTab = (provider: HupuProvider) => {
  return vscode.commands.registerCommand("hupu.changeTab", async () => {
    const tab = await vscode.window.showQuickPick([
      { label: "步行街热帖", description: "all-gambia" },
      { label: "步行街主干道", description: "topic-daily" },
      { label: "股票区", description: "stock" },
      { label: "历史区", description: "history" },
      { label: "健身区", description: "fit" },
      { label: "恋爱区", description: "love" },
      { label: "校园区", description: "school" },
      { label: "职场区", description: "workplace" },
    ]);
    if (tab) {
      await provider.getData(tab.description);
      await setConfigByKey("hupuTab", tab.description);
      // await vscode.commands.executeCommand('hupu.refresh');
      await showInfo(`Hupu 切换为 ${tab.label}`);
    }
  });
};

// 更改ngatab
export const changeNgaTab = (ngaProvider: NgaProvider) => {
  return vscode.commands.registerCommand("nga.changeTab", async () => {
    const tab = await vscode.window.showQuickPick([
      // 置顶版块
      { label: "网事杂谈", description: "-7" },
      { label: "晴风村", description: "-7955747" },
      // 网事杂谈其他
      { label: "国际新闻", description: "843" },
      { label: "大时代(股市)", description: "706" },
      { label: "寂寞的车", description: "-343809" },
      { label: "漩涡书院", description: "524" },
      { label: "音乐影视", description: "-576177" },
      { label: "生命之杯(足球)", description: "-81981" },
      { label: "篮球", description: "485" },
      { label: "职场人生", description: "-1459709" },
      { label: "模型手办", description: "716" },
      { label: "历史研究", description: "847" },
      { label: "厨艺美食交流", description: "-608808" },
      { label: "家居装修", description: "-187628" },
      { label: "小窗视界", description: "-8725919" },
      { label: "娱乐吃瓜区", description: "-39223361" },
      { label: "萌萌宠物", description: "-353371" },
      { label: "麻将", description: "-7678526" },
      { label: "我们的骑迹", description: "-444012" },
      { label: "发烧友", description: "-2671" },
      { label: "桌游讨论", description: "761" },
      { label: "剧本杀", description: "767" },
      { label: "程序员职业交流", description: "-202020" },
      { label: "爱与家庭", description: "859" },
      // IT软硬件
      { label: "消费电子IT新闻", description: "436" },
      { label: "PC硬件配置", description: "334" },
      { label: "手机研究所", description: "722" },
      { label: "外设硬件", description: "773" },
      { label: "二手交易", description: "498" },
      // 魔兽世界
      { label: "艾泽拉斯议事厅", description: "7" },
      { label: "风纪委员会", description: "230" },
      { label: "前瞻资讯", description: "310" },
      { label: "熊猫人之谜", description: "510502" },
      { label: "大地的裂变", description: "510426" },
      { label: "巫妖王之怒", description: "850" },
      { label: "经典旧世", description: "624" },
      { label: "国服以外", description: "323" },
      { label: "五晨寺(武僧)", description: "390" },
      { label: "黑锋要塞(死骑)", description: "320" },
      { label: "铁血沙场(战士)", description: "181" },
      { label: "魔法圣堂(法师)", description: "182" },
      { label: "信仰神殿(牧师)", description: "183" },
      { label: "风暴祭坛(萨满)", description: "185" },
      { label: "翡翠梦境(德鲁伊)", description: "186" },
      { label: "猎手大厅(猎人)", description: "187" },
      { label: "圣光之力(圣骑士)", description: "184" },
      { label: "恶魔深渊(术士)", description: "188" },
      { label: "暗影裂口(盗贼)", description: "189" },
      { label: "伊利达雷(DH)", description: "477" },
      { label: "巨龙群岛(唤魔师)", description: "851" },
      { label: "副本专区", description: "218" },
      { label: "幻化讨论", description: "388" },
      { label: "宠物讨论", description: "411" },
      { label: "地精商会", description: "191" },
      { label: "竞技场/战场", description: "272" },
      { label: "战争档案", description: "213" },
      { label: "公会管理", description: "255" },
      { label: "人员招募", description: "306" },
      { label: "插件研究", description: "200" },
      { label: "魔兽世界大脚", description: "240" },
      { label: "镶金玫瑰", description: "254" },
      { label: "壁画洞窟", description: "124" },
      { label: "作家协会", description: "102" },
      // 暴雪游戏
      { label: "守望先锋", description: "459" },
      { label: "炉石传说", description: "422" },
      { label: "暗黑破坏神3", description: "318" },
      { label: "风暴英雄", description: "431" },
      { label: "星际争霸2", description: "406" },
      { label: "魔兽争霸", description: "490" },
      { label: "暗黑破坏神4", description: "685" },
      { label: "暗黑2重制版", description: "769" },
      { label: "暗黑:不朽", description: "631" },
      { label: "魔兽大作战", description: "852" },
      { label: "暴雪嘉年华", description: "632" },
      // 拳头游戏
      { label: "英雄联盟", description: "-152678" },
      { label: "无畏契约", description: "708" },
      { label: "云顶之弈", description: "660" },
      { label: "英雄联盟手游", description: "681" },
      { label: "英雄联盟策略卡牌", description: "680" },
      // Valve游戏
      { label: "CS:GO", description: "482" },
      { label: "DOTA2", description: "321" },
      { label: "刀塔卡牌", description: "622" },
      { label: "刀塔霸业", description: "659" },
      { label: "Deadlock", description: "510478" },
      // 游戏专版
      { label: "游戏综合讨论区", description: "414" },
      { label: "游戏业界新闻", description: "510505" },
      { label: "PS游戏综合讨论", description: "614" },
      { label: "XBOX游戏综合讨论", description: "615" },
      { label: "Nintendo游戏综合讨论", description: "616" },
      { label: "ROG掌机", description: "510431" },
      { label: "Steam Deck", description: "510383" },
      { label: "怪物猎人", description: "489" },
      { label: "精灵宝可梦", description: "-452227" },
      { label: "流放之路系列", description: "510481" },
      { label: "格斗游戏综合", description: "591" },
      { label: "Battlefield系列", description: "552" },
      { label: "博德之门系列", description: "510417" },
      { label: "黑神话:悟空", description: "510472" },
      { label: "战锤40K", description: "332" },
      { label: "全面战争系列", description: "630" },
      { label: "赛博朋克2077", description: "759" },
      { label: "塞尔达传说", description: "510397" },
      { label: "血源/黑魂", description: "513" },
      { label: "艾尔登法环", description: "831" },
      { label: "只狼", description: "644" },
      { label: "怪物猎人", description: "489" },
      { label: "女神异闻录", description: "414" },
      { label: "文明", description: "-5951001" },
      { label: "Paradox游戏综合", description: "661" },
      { label: "火炬之光:无限", description: "510368" },
      { label: "荒野大镖客2", description: "628" },
      { label: "生化危机系列", description: "638" },
      { label: "最终幻想系列", description: "414" },
      { label: "使命召唤系列", description: "636" },
      { label: "刺客信条", description: "627" },
      { label: "彩虹六号:围攻", description: "600" },
      { label: "星空", description: "510421" },
      { label: "辐射", description: "486" },
      { label: "巫师3", description: "514" },
      { label: "古剑奇谭", description: "634" },
      { label: "仙剑奇侠传系列", description: "414" },
      { label: "幻兽帕鲁", description: "510434" },
      { label: "传统RPG综合讨论", description: "-21175563" },
      { label: "文字冒险游戏综合", description: "-60252908" },
      // 网游
      { label: "网络游戏综合", description: "300" },
      { label: "最终幻想14", description: "-362960" },
      { label: "命运方舟", description: "842" },
      { label: "剑网3", description: "-7861121" },
      { label: "游戏王:大师决斗", description: "840" },
      { label: "三角洲行动", description: "510489" },
      { label: "永劫无间", description: "796" },
      { label: "坦克世界", description: "-46468" },
      { label: "战舰世界", description: "441" },
      { label: "地下城与勇士", description: "-47218" },
      { label: "Apex英雄", description: "640" },
      { label: "战争雷霆", description: "-6194253" },
      { label: "绝地求生", description: "568" },
      { label: "逃离塔科夫", description: "300" },
      { label: "Minecraft", description: "481" },
      { label: "上古卷轴Online", description: "435" },
      { label: "星际公民", description: "764" },
      { label: "命运", description: "563" },
      { label: "星战前夜EVE", description: "-2371813" },
      { label: "万智牌MTG", description: "-38213667" },
      { label: "EAFC系列", description: "443" },
      { label: "堡垒之夜", description: "609" },
      // 手游
      { label: "手游综合讨论", description: "428" },
      { label: "手机游戏快讯", description: "863" },
      { label: "手游评分版", description: "571" },
      { label: "明日方舟", description: "-34587507" },
      { label: "崩坏:星穹铁道", description: "818" },
      { label: "原神", description: "650" },
      { label: "鸣潮", description: "854" },
      { label: "绝区零", description: "853" },
      { label: "阴阳师", description: "538" },
      { label: "王者荣耀", description: "516" },
      { label: "FGO", description: "540" },
      { label: "碧蓝航线", description: "564" },
      { label: "蔚蓝档案", description: "834" },
      { label: "赛马娘", description: "-40743354" },
      { label: "碧蓝幻想", description: "560" },
      { label: "公主连结", description: "-10308342" },
      { label: "战双帕弥什", description: "696" },
      { label: "少女前线", description: "-547859" },
      { label: "少前2:追放", description: "-195362" },
      { label: "第七史诗", description: "642" },
      { label: "崩坏3", description: "549" },
      { label: "NIKKE", description: "510371" },
      { label: "影之诗", description: "510500" },
      { label: "重返未来:1999", description: "510389" },
      { label: "边狱巴士公司", description: "510484" },
      { label: "白夜极光", description: "803" },
      { label: "尘白禁区", description: "510443" },
      { label: "无期迷途", description: "510354" },
      { label: "第五人格", description: "607" },
      { label: "部落冲突COC", description: "-51095" },
      { label: "皇室战争", description: "492" },
      { label: "荒野乱斗", description: "726" },
      { label: "和平精英", description: "599" },
      // 二次元
      { label: "二次元国家地理", description: "-447601" },
      { label: "Vtuber综合讨论区", description: "-60204499" },
      { label: "二次元跑团综合", description: "784" },
      { label: "游戏王", description: "-2081117" },
      { label: "东方Project", description: "-40530437" },
      { label: "NGATOYS", description: "716" },
      { label: "VOCALOID", description: "-40639972" },
      { label: "视频与主播讨论", description: "510418" },
      { label: "Cosplay", description: "472" },
      { label: "Galgame", description: "-60252908" },
      { label: "LoveLive系列", description: "510416" },
      { label: "$(edit) 自定义输入", description: "custom" },
    ]);
    if (tab) {
      let tabValue = tab.description;
      let tabLabel = tab.label;

      // 如果选择了自定义输入
      if (tab.description === "custom") {
        const customInput = await vscode.window.showInputBox({
          prompt: "请输入自定义的 NGA 版块ID",
          placeHolder: "例如: -7, 524, -39223361 等",
        });
        if (!customInput) return; // 用户取消输入
        tabValue = customInput;
        tabLabel = customInput;
      }

      await ngaProvider.getData(tabValue);
      await setConfigByKey("ngaTab", tabValue);
      await showInfo(`nga 切换为 ${tabLabel}`);
    }
  });
};

// 设置知乎token
export const setZhihuTokenCommand = () => {
  return vscode.commands.registerCommand(
    "touchfish.setZhihuToken",
    async () => {
      const zhihuCookie = await vscode.window.showInputBox({
        prompt: "请输入知乎的Cookie",
        placeHolder: "请输入知乎的Cookie",
      });
      if (zhihuCookie !== undefined) {
        await setConfigByKey("zhihuCookie", zhihuCookie);
        await showInfo("知乎Cookie设置成功,点击刷新按钮查看!");
      }
    }
  );
};

// 设置微博token
export const setWeiboTokenCommand = () => {
  return vscode.commands.registerCommand(
    "touchfish.setWeiboToken",
    async () => {
      const weiboCookie = await vscode.window.showInputBox({
        prompt: "请输入微博的Cookie",
        placeHolder: "请输入微博的Cookie",
      });
      if (weiboCookie !== undefined) {
        await setConfigByKey("weiboCookie", weiboCookie);
        await showInfo("微博Cookie设置成功,点击刷新按钮查看!");
      }
    }
  );
};

// 设置微博用户ID
export const setWeiboUserIdCommand = () => {
  return vscode.commands.registerCommand(
    "touchfish.setWeiboUserId",
    async () => {
      const weiboUserId = await vscode.window.showInputBox({
        prompt: "请输入微博用户ID (例如 1669879400 或个性域名)",
        placeHolder: "请输入微博用户ID",
      });
      if (weiboUserId !== undefined) {
        await setConfigByKey("weiboUserId", weiboUserId);
        await showInfo("微博用户ID设置成功!");
      }
    }
  );
};

// 设置NGA-token
export const setNgaTokenCommand = () => {
  return vscode.commands.registerCommand("touchfish.setNgaToken", async () => {
    const ngaCookie = await vscode.window.showInputBox({
      prompt: "请输入NGA的Cookie",
      placeHolder: "请输入NGA的Cookie",
    });
    if (ngaCookie !== undefined) {
      await setConfigByKey("ngaCookie", ngaCookie);
      await showInfo("NGA-Cookie设置成功,点击刷新按钮查看!");
    }
  });
};

// 设置小红书 cookie
export const setXhsTokenCommand = () => {
  return vscode.commands.registerCommand("touchfish.setXhsToken", async () => {
    const xhsCookie = await vscode.window.showInputBox({
      prompt: "请输入小红书的Cookie",
      placeHolder: "请输入小红书的Cookie",
    });
    if (xhsCookie !== undefined) {
      await setConfigByKey("xhsCookie", xhsCookie);
      await showInfo("小红书Cookie设置成功,切换到小红书视图查看!");
    }
  });
};

// 切换 Linux.do tab
export const switchLinuxDoTab = () => {
  return vscode.commands.registerCommand(
    "touchfish.switchLinuxDoTab",
    async () => {
      const tab = await vscode.window.showQuickPick([
        { label: "最新", description: "latest" },
        { label: "热门", description: "hot" },
        { label: "排行榜", description: "top" },
      ]);
      if (tab) {
        await setConfigByKey("linuxDoTab", tab.description);
        await vscode.commands.executeCommand("linuxdo.refresh");
        await showInfo(`Linux.do 切换为 ${tab.label}`);
      }
    }
  );
};

// 设置 Linux.do cookie
export const setLinuxDoTokenCommand = () => {
  return vscode.commands.registerCommand(
    "touchfish.setLinuxDoToken",
    async () => {
      const linuxDoCookie = await vscode.window.showInputBox({
        prompt: "请输入 Linux.do 的 Cookie",
        placeHolder: "请输入 Linux.do 的 Cookie",
      });
      if (linuxDoCookie !== undefined) {
        await setConfigByKey("linuxDoCookie", linuxDoCookie);
        await showInfo("Linux.do Cookie 设置成功！");
        await vscode.commands.executeCommand("linuxdo.refresh");
      }
    }
  );
};

// 设置 B站 cookie
export const setBilibiliTokenCommand = () => {
  return vscode.commands.registerCommand(
    "touchfish.setBilibiliToken",
    async () => {
      const bilibiliCookie = await vscode.window.showInputBox({
        prompt: "请输入B站的Cookie",
        placeHolder: "请输入B站的Cookie（从浏览器开发者工具中获取）",
      });
      if (bilibiliCookie !== undefined) {
        await setConfigByKey("bilibiliCookie", bilibiliCookie);
        await showInfo("B站Cookie设置成功！");
      }
    }
  );
};
