<template>
    <div class="table-plus">
        <table-plus-toolbar
            v-bind="$attrs"
            :columns="columns"
            @row-add="handleRowAdd"
            @row-add-child="handleRowAddChild"
            @row-remove="handleRowRemove"
            @custom-btn-click="handleCustomBtnClick"
            @search="handleSearch"
            @filtered-columns-change="handleFilteredColumnsChange"
        />
        <el-table
            ref="table"
            v-bind="$attrs"
            v-on="$listeners"
            :data="filteredDataSource"
            :row-key="rowKey"
            :row-class-name="generateRowClassName"
            cell-class-name="table-plus__cell"
            highlight-current-row
            default-expand-all
            @row-click="handleRowDoubleClick"
            @selection-change="handleSelectionChange"
            @current-change="handleCurrentChange"
        >
            <el-table-column type="selection" width="55" />
            <template v-for="(columnItem, columnIndex) in columns">
                <el-table-column
                    v-if="filteredColumnProps.includes(columnItem.prop)"
                    v-bind="columnItem"
                    :key="columnItem.prop"
                >
                    <template slot-scope="scope">
                        <template v-if="isSameRow(scope.row, currentEditRow)">
                            <table-plus-control
                                v-if="columnItem.editable"
                                v-model="currentEditRowModel[columnItem.prop]"
                                v-bind="columnItem.editProps || {}"
                                @change="
                                    val =>
                                        handleEditValueChange({
                                            value: val,
                                            prop: columnItem.prop,
                                            rowModel: currentEditRowModel
                                        })
                                "
                            />

                            <template v-else-if="columnItem.slotProp">
                                <slot :name="columnItem.slotProp" :row="scope.row" />
                            </template>

                            <span v-else>
                                {{
                                    renderColumnText({
                                        column: columnItem,
                                        text: currentEditRowModel[columnItem.prop],
                                        row: scope.row,
                                        index: columnIndex
                                    })
                                }}
                            </span>

                            <el-popover
                                v-if="columnIndex === columns.length - 1"
                                v-model="editToolbarVisible"
                                popper-class="popper__table-edit-toolbar"
                                placement="right"
                                trigger="manual"
                                :visible-arrow="false"
                            >
                                <div slot="reference" />
                                <el-button type="primary" size="mini" @click="confirmEdit">保存</el-button>
                                <el-button size="mini" @click="cancelEdit">取消</el-button>
                            </el-popover>
                        </template>

                        <template v-else-if="columnItem.slotProp">
                            <slot :name="columnItem.slotProp" :row="scope.row" />
                        </template>

                        <span v-else>
                            {{
                                renderColumnText({
                                    column: columnItem,
                                    text: scope.row[columnItem.prop],
                                    row: scope.row,
                                    index: columnIndex
                                })
                            }}
                        </span>
                    </template>
                </el-table-column>
            </template>
        </el-table>
    </div>
</template>

<script>
import Sortable from 'sortablejs';
import TablePlusToolbar from './toolbar/index.vue';
import TablePlusControl from './control/index.vue';
import { randomString, removeItemsInTree } from './utils';
import { getLevelFromClassName } from './utils/dom';

// sortable 实例
let sortable = null;

export default {
    name: 'TablePlus',
    components: { TablePlusToolbar, TablePlusControl },
    inheritAttrs: false,
    props: {
        // 数据唯一标识，必填
        rowKey: {
            type: String,
            default: 'id'
        },
        // 列配置
        columns: {
            type: Array,
            default: () => []
        },
        // 数据源
        dataSource: {
            type: Array,
            default: () => []
        },
        // 是否启用双击编辑
        rowEditable: {
            type: Boolean,
            default: true
        },
        // 是否启用行排序
        rowSortable: {
            type: Boolean,
            default: false
        },
        // 新增一行时的默认值
        initialRowModel: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            // 搜索文本
            searchText: '',
            // 筛选列
            filteredColumnProps: [],
            // 选择的行
            selectedRows: [],
            // 当前高亮行
            currentHighlightRow: null,
            // 当前编辑的行
            currentEditRow: null,
            // 当前编辑的行模型
            currentEditRowModel: null,
            // 是否显示编辑工具栏
            editToolbarVisible: false
        };
    },
    computed: {
        // 筛选行
        filteredDataSource() {
            if (!this.searchText) {
                return this.dataSource;
            }
            return this.filterList(this.dataSource, this.searchText.toUpperCase());
        }
    },
    watch: {
        /**
         * 赋值过滤列
         */
        columns: {
            handler(val) {
                this.filteredColumnProps = val.map(item => item.prop);
            },
            immediate: true
        },

        /**
         * 编辑时浅复制当前行数据
         */
        currentEditRow(val) {
            this.editToolbarVisible = false;
            if (!val) {
                this.currentEditRowModel = null;
                return;
            }
            this.$nextTick(() => (this.editToolbarVisible = true));
            this.currentEditRowModel = { ...val };
        }
    },
    mounted() {
        if (this.rowSortable) {
            this.initTableSortable();
        }
    },
    methods: {
        /**
         * 初始化表格拖拽
         */
        initTableSortable() {
            const selector = this.$refs.table.$el.querySelector('.el-table__body-wrapper > table > tbody');
            sortable = Sortable.create(selector, {
                animation: 300,
                draggable: '.el-table__row',
                filter: '.row-draggable--disabled',
                onMove: event => {
                    const draggedLevel = getLevelFromClassName(event.dragged.className);
                    const relatedLevel = getLevelFromClassName(event.related.className);
                    return draggedLevel === relatedLevel;
                },
                onEnd: () => {
                    // 重置当前正在编辑的行的工具栏，防止位置错乱
                    if (this.currentEditRow) {
                        this.editToolbarVisible = false;
                        this.$nextTick(() => (this.editToolbarVisible = true));
                    }
                }
            });
        },

        /**
         * 生成表格行类名
         */
        generateRowClassName({ row }) {
            if (row.children?.length) {
                return 'row-draggable--disabled';
            }
        },

        /**
         * 表格当前行
         */
        handleCurrentChange(row) {
            this.currentHighlightRow = row;
        },

        /**
         * 渲染 Column 文本
         */
        renderColumnText({ column, text, row, index }) {
            if (column.formatter) {
                return column.formatter(row, column, text, index);
            }
            return text;
        },

        /**
         * 前端搜索
         */
        handleSearch(val) {
            this.searchText = val;
        },

        /**
         * 点击自定义按钮
         */
        handleCustomBtnClick(onClick) {
            if (!onClick) {
                return;
            }
            onClick(this.selectedRows);
        },

        /**
         * 列过滤
         */
        handleFilteredColumnsChange(value) {
            this.filteredColumnProps = value;
            this.$nextTick(() => this.$refs.table.doLayout());
        },

        /**
         * 过滤列表，支持树形
         */
        filterList(list, text) {
            return list.reduce((acc, cur) => {
                const exist = Object.values(cur).some(
                    value => (value === 0 || value) && String(value).toUpperCase().includes(text)
                );
                if (exist) {
                    acc.push(cur);
                    return acc;
                }
                if (Array.isArray(cur.children)) {
                    const children = this.filterList(cur.children, text);
                    if (children.length) {
                        acc.push({ ...cur, children });
                    }
                }
                return acc;
            }, []);
        },

        /**
         * 选择行
         */
        handleSelectionChange(selection) {
            this.selectedRows = selection;
            this.$emit('row-select', selection);
        },

        /**
         * 双击时行编辑
         */
        handleRowDoubleClick(row) {
            if (!this.rowEditable) {
                return;
            }
            this.editRow(row);
        },

        /**
         * 添加行
         */
        handleRowAdd() {
            const newRow = this.initNewRow();
            this.dataSource.push(newRow);
            this.editRow(newRow);
        },

        /**
         * 增加子行
         */
        handleRowAddChild() {
            const parentRow = this.currentHighlightRow || this.selectedRows[0];
            if (!parentRow) {
                this.$message.warning('请先选中一行');
                return;
            }
            const newRow = this.initNewRow();
            if (Array.isArray(parentRow.children)) {
                parentRow.children.push(newRow);
            } else {
                this.$set(parentRow, 'children', [newRow]);
            }
            this.editRow(newRow);
        },

        /**
         * 编辑指定行
         */
        editRow(row) {
            this.currentEditRow = row;
            this.$refs.table.clearSelection();
            this.$nextTick(() => {
                this.$refs.table.toggleRowSelection(row, true);
                this.$refs.table.setCurrentRow(row);
            });
        },

        /**
         * 编辑值 change
         * value: 当前值
         * prop: 当前编辑的属性
         * rowModel: 当前编辑的行实体
         */
        handleEditValueChange({ value, prop, rowModel }) {
            this.$emit('row-edit-value-change', { value, prop, rowModel });
        },

        /**
         * 初始化新行
         */
        initNewRow() {
            return { [this.rowKey]: randomString(), _isNewRow: true, ...this.initialRowModel };
        },

        /**
         * 行移除
         */
        handleRowRemove() {
            if (!this.selectedRows?.length) {
                return;
            }
            const handleRemove = () => removeItemsInTree(this.dataSource, this.selectedRows);
            this.$emit('row-remove', this.selectedRows, handleRemove);
        },

        /**
         * 确认编辑
         */
        confirmEdit() {
            const newRow = { ...this.currentEditRowModel };
            this.$emit('row-edit-confirm', newRow);
            this.replaceItemInList(this.dataSource, this.currentEditRow, newRow);
            this.currentEditRow = null;
        },

        /**
         * 替换列表中指定项，支持树形结构
         */
        replaceItemInList(list, oldItem, newItem) {
            const index = list.findIndex(item => this.isSameRow(item, oldItem));
            if (index !== -1) {
                Object.assign(list[index], newItem);
                return true;
            }
            for (const item of list) {
                if (item.children?.length) {
                    if (this.replaceItemInList(item.children, oldItem, newItem)) {
                        break;
                    }
                }
            }
        },

        /**
         * 是否是同一行
         */
        isSameRow(row1, row2) {
            if (!row1 || !row2) {
                return false;
            }
            if (row1 === row2) {
                return true;
            }
            if (!(row1[this.rowKey] || row2[this.rowKey] === 0) || !(row2[this.rowKey] || row2[this.rowKey] === 0)) {
                return false;
            }
            return row1[this.rowKey] === row2[this.rowKey];
        },

        /**
         * 取消编辑
         */
        cancelEdit() {
            this.currentEditRow = null;
        }
    },
    beforeUnmount() {
        // 销毁 sortable
        if (sortable) {
            sortable.destroy();
        }
    }
};
</script>

<style lang="scss" scoped>
.table-plus {
    ::v-deep &__cell .cell {
        display: flex;
        align-items: center;
    }
}
</style>

<style lang="scss">
.popper__table-edit-toolbar {
    min-width: 120px;
}
</style>