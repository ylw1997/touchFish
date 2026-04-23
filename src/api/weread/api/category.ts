import {get} from "../utils/request";

/**
 * 图书分类
 * 纯数字的为大类，下面还分小类，从1开始累加
 */
export type BookCategory =
    | "rising" // 飙升榜
    | "newbook" // 新书榜
    | "general_novel_rising" // 小说榜
    | "all" // 总榜
    | "newrating_publish" // 神作榜
    | "newrating_potential_publish" // 潜力榜
    | "hot_search" // 热搜榜
    | "100000" // 精品小说
    | "200000" // 历史
    | "300000" // 文学
    | "400000" // 艺术
    | "500000" // 人物传记
    | "600000" // 哲学宗教
    | "700000" // 计算机
    | "800000" // 心理
    | "900000" // 社会文化
    | "1000000" // 个人成长
    | "1100000" // 经济理财
    | "1200000" // 政治军事
    | "1300000" // 童书
    | "1400000" // 教育学习
    | "1500000" // 科学技术
    | "1600000" // 生活百科
    | "1700000" // 期刊杂志
    | "1800000" // 原版书
    | "2100000" // 医学健康
    | "1900000" // 男生小说
    | "2000000"; // 女生小说

/**
 * 获取指定分类下面的图书列表
 * @param categoryId 分类
 * @param startAt 起始排名(从1开始)
 * @param cookie
 * @description 每次返回20条数据
 */
export async function bookListInCategory(
    categoryId: string,
    startAt = 1,
) {
    const query: Record<string, number> = {
        maxIndex: startAt - 1,
        rank: 1,
    };
    if (/^\d+$/.test(categoryId)) {
        delete query.rank;
    }
    const resp = await get(
        `https://weread.qq.com/web/bookListInCategory/${categoryId}`,
        query,
    );
    return resp.json();
}

/**
 * 查询分类详情
 * @param categoryId 分类id
 * @param cookie
 */
export async function categoryinfo(categoryId: BookCategory, cookie = "") {
    let rank = 1;
    if (/^\d+$/.test(categoryId)) {
        rank = 0;
    }
    const resp = await get("https://weread.qq.com/web/categoryinfo", {
        rank: rank,
        categoryId: categoryId,
    }, {
        cookie: cookie,
    });
    return resp.json();
}

/**
 * 查询分类数据
 */
export async function categories() {
    const resp = await get("https://weread.qq.com/web/categories", {synckey: 0});
    return resp.json();
}

/**
 * 获取推荐书籍
 */
export async function recommendBooks(cookie = "") {
    const resp = await get("https://weread.qq.com/web/recommend_books", {}, {
        cookie: cookie,
    });
    return resp.json();
}

interface Category {
    CategoryId: string
    sublist: Category[]
}

/**
 * 获取所有的分类id
 */
export async function getAllCategoryId() {
    const categoryIds: string[] = []
    const resp = await categories()
    const allCategories = resp.data.flatMap((_: any) => {
        if (_.categories && Array.isArray(_.categories)) {
            return _.categories
        } else {
            return _
        }
    })
    collectCategoryId(allCategories, categoryIds)
    return categoryIds
}

function collectCategoryId(categories: Category[], result: string[]) {
    for (const category of categories) {
        if (category.CategoryId) {
            result.push(category.CategoryId)
        }
        if (category.sublist && category.sublist.length > 0) {
            collectCategoryId(category.sublist, result)
        }
    }
}
