// 配置编译环境和线上环境之间的切换
const env = process.env;
const baseUrl = '';
// iconfont图标库
// at.alicdn.com/t/font_3282173_hyq46e72ua.css
const iconfontVersion = ['3282173_5tvbzdtoaee'];
const iconfontUrl = `//at.alicdn.com/t/font_$key.css`;

export {
    baseUrl,
    iconfontUrl,
    iconfontVersion,
    env
}