import Vue from 'vue';

import {
    Dialog,
    Button,
    ButtonGroup,
    Pagination,
    Menu,
    Submenu,
    MenuItem,
    Input,
    Table,
    TableColumn,
    Tabs,
    TabPane,
    Form,
    FormItem,
    Container,
    Header,
    Aside,
    Main,
    Icon,
    Avatar,
    Row,
    Col,
    MessageBox,
    Message,
    Select,
    Option,
    Upload,
    Image,
    DatePicker,
    Loading,
    Checkbox,
    CheckboxButton,
    CheckboxGroup,
    Radio,
    RadioGroup,
    RadioButton,
    Cascader,
    Tooltip,
    Breadcrumb,
    BreadcrumbItem
} from 'element-ui';

Vue.use(Dialog);
Vue.use(Pagination);
Vue.use(Menu);
Vue.use(Submenu);
Vue.use(MenuItem);
Vue.use(Input);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Container);
Vue.use(Header);
Vue.use(Aside);
Vue.use(Main);
Vue.use(Icon);
Vue.use(Avatar);
Vue.use(Row);
Vue.use(Col);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Select);
Vue.use(Option);
Vue.use(Upload);
Vue.use(Image);
Vue.use(DatePicker);
Vue.use(Loading);
Vue.use(Checkbox);
Vue.use(CheckboxButton);
Vue.use(CheckboxGroup);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Cascader);
Vue.use(Tooltip);
Vue.use(Breadcrumb);
Vue.use(BreadcrumbItem);

Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$message = Message;
