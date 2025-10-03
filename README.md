# figure-relationship-diagram

人物关系图

## 简介

用了 [D3.js](https://github.com/d3/d3) 工具，参考了这个项目：<https://github.com/aelooee/red-dream-network-Tr>，效果：<https://aelooee.github.io/red-dream-network-Tr/>，但是这里用的是**力导向布局**，不是我想要的效果，然后就用**智谱清言**生成了一个，并不断优化。

### 优化效果和bug

index.html：基本框架（图+搜索功能）。

index2.html：搜索功能优化。

index3.html：基本框架。

index_fixed1-示例数据.html：**修复**手机端适配问题，手机端添加侧边栏。

index_fixed2-真实数据.html：添加较多层级数据，**bug**：受限于画布大小，节点之间会层叠。

index_fixed3-优化层叠.html：**修复**节点层叠问题。

index_fixed4-改成水平分布.html：改成水平分布；手机端减小搜索栏大小；添加滚动条。

index_fixed4-改成水平分布-优化布局.html：调整节点之间的距离、连线长度；搜索后命中节点；手机端，搜索命中后隐藏侧边栏。

index_fixed4-改成水平分布-优化布局2.html：修复提示框位置；修复搜索命中节点，并居中；修复点击事件会移动的问题。

### 待处理问题

1. ~~悬浮/点击时，提示窗位置不够好。~~

2. 缩放后，悬浮/点击时，提示窗位置不够好。

3. ~~搜索后，命中不了节点。~~
4. ~~刚进页面时，设置把某个节点放中间。~~

5. 手机端适配问题。

6. 



## GitHub Page HTML访问路径

参考实例：

index3.html：<https://yansheng836.github.io/figure-relationship-diagram/index3.html>

---

<!-- START_TOC_GENERATED -->
index.html: <https://yansheng836.github.io/figure-relationship-diagram/index.html>

index2.html: <https://yansheng836.github.io/figure-relationship-diagram/index2.html>

index3.html: <https://yansheng836.github.io/figure-relationship-diagram/index3.html>

index_fixed1-示例数据.html: <https://yansheng836.github.io/figure-relationship-diagram/index_fixed1-示例数据.html>

index_fixed2-真实数据.html: <https://yansheng836.github.io/figure-relationship-diagram/index_fixed2-真实数据.html>

index_fixed3-优化层叠.html: <https://yansheng836.github.io/figure-relationship-diagram/index_fixed3-优化层叠.html>

index_fixed4-改成水平分布-优化布局.html: <https://yansheng836.github.io/figure-relationship-diagram/index_fixed4-改成水平分布-优化布局.html>

index_fixed4-改成水平分布-优化布局2.html: <https://yansheng836.github.io/figure-relationship-diagram/index_fixed4-改成水平分布-优化布局2.html>

index_fixed4-改成水平分布.html: <https://yansheng836.github.io/figure-relationship-diagram/index_fixed4-改成水平分布.html>

