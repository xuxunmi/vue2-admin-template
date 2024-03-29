import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './plugins/elementui/element.js';
import '@/styles/global.css';
import '@/mock/index.js';
import 'tailwindcss/tailwind.css';

// 引入bpmn-js的css
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

//注册加载过滤器
import * as filters from './filters'; // 全局filter
Object.keys(filters).forEach(key => {
    Vue.filter(key, filters[key]);
});

// 全局自定义指令
import directives from './directives';
Vue.use(directives);

// 全局引入 vxe-table 表格
import 'xe-utils';
import VXETable from 'vxe-table';
import 'vxe-table/lib/style.css';
Vue.use(VXETable);

// import './permission'; // 引入动态路由权限
import './error'; // 错误日志

// 引入打印插件
import Print from 'vue-print-nb';
Vue.use(Print);

// 引入语言国际化
import i18n from '@/config/i18n';
VXETable.setup({
    // 对组件内置的提示语进行国际化翻译
    i18n: (key, args) => i18n.t(key, args)
});

// 加载相关url地址
import * as urls from '@/config/env';
Object.keys(urls).forEach(key => {
    // console.log('urls: ', urls);
    Vue.prototype[key] = urls[key];
});

// 动态加载阿里云矢量图库
import { dynamicCSS } from '@/utils/tools.js';
import { iconfontUrl, iconfontVersion } from '@/config/env';
iconfontVersion.forEach(ele => {
    // console.log(iconfontUrl.replace("$key", ele));
    dynamicCSS(iconfontUrl.replace('$key', ele));
});

// vue-panzoom是一个基于Vue的平移和缩放组件，且支持鼠标滚轮操作，可针对DOM元素，图片元素，SVG元素，gitHub：https://github.com/thecodealer/vue-panzoom
import panZoom from 'vue-panzoom';
Vue.use(panZoom);

// 阻止启动生产消息
Vue.config.productionTip = false;

// vue-devtools 浏览器开发调试
Vue.config.devtools = true;

new Vue({
    i18n,
    router,
    store,
    render: h => h(App)
}).$mount('#app');
