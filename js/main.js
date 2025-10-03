// 异步加载数据
async function loadData() {
  try {
    const response = await fetch('./data/main.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 将加载的数据赋值给全局变量 familyData
    familyData = await response.json();
  } catch (error) {
    console.error("加载家族树数据失败:", error);
    // 可选：在加载失败时显示错误消息
    document.getElementById('family-tree').innerHTML = '<p style="text-align:center; color:red;">加载数据失败，请检查 data.json 文件和路径。</p>';
  }
}
// // 家族数据结构
// const familyData = ;

// 全局变量
let svg, g, simulation, currentLayout = 'tree';
let selectedNode = null;
let showLabels = true;
let showImages = true;
let animate = false;
let zoom; // 修复1：添加全局zoom变量

// 初始化应用
async function initApp() {
  // 1. 关键：等待数据加载完成
  await loadData();

  // 检查数据是否成功加载，防止因加载失败导致程序崩溃
  if (!familyData || !familyData.nodes || familyData.nodes.length === 0) {
    console.warn("未加载到有效数据，停止初始化。");
    return;
  }

  setupSVG();
  renderTree();
  setupEventListeners();
  updateStats();

  // 在全局变量区域添加
  let defaultFocusNodeId1 = 1; // 设置默认聚焦的节点ID（例如颜之推）
  // 设置初始焦点
  const defaultNode = familyData.nodes.find(n => n.id === defaultFocusNodeId1);
  if (defaultNode) {
    selectedNode = defaultNode;
    // 延迟执行以确保渲染完成
    setTimeout(() => {
      focusOnNodeBySearch(defaultNode);
      highlightConnections(defaultNode);
    }, 500);
  }
}

// 设置SVG画布
function setupSVG() {
  const container = document.getElementById('family-tree');
  const width = container.clientWidth;
  const height = container.clientHeight;

  svg = d3.select('#family-tree')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // 添加缩放功能
  zoom = d3.zoom() // 修复1：保存zoom实例
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  g = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);
}

// 渲染树形布局
function renderTree() {
  g.selectAll('*').remove();

  const width = document.getElementById('family-tree').clientWidth;
  const height = document.getElementById('family-tree').clientHeight;

  // 计算水平布局所需宽度：每代间距200px + 左右边距
  const generations = [...new Set(familyData.nodes.map(n => n.generation))].length;
  const layoutWidth = generations * 200 + 400;

  // 创建层次结构
  const hierarchyData = createHierarchy();
  const root = d3.hierarchy(hierarchyData);

  // 创建水平树布局 - 宽度根据代际数量动态计算
  const treeLayout = d3.tree()
    .size([height - 100, layoutWidth]) // 注意：先高度后宽度
    .nodeSize([50, 150]) // 节点大小：垂直50px，水平200px
    .separation((a, b) => (a.parent == b.parent ? 1.4 : 1.4));// 堂兄弟间距稍大

  treeLayout(root);

  // --- 这个逻辑块会在每次renderTree时执行 ---
  // --- 调试聚焦逻辑 ---
  console.log("renderTree: selectedNode is", selectedNode); // 调试1: 检查selectedNode

  // 在 renderTree() 函数中，找到这段代码并取消注释
  // if (selectedNode) {
  //     const targetDescendant = root.descendants().find(d => d.data.id === selectedNode.id);

  //     if (targetDescendant) {
  //         const nodeX = targetDescendant.y - layoutWidth / 2 + 200;
  //         const nodeY = targetDescendant.x - height / 2 + 50;

  //         const targetTransform = d3.zoomIdentity
  //             .translate(width / 2 - nodeX, height / 2 - nodeY)
  //             .scale(1.0);

  //         svg.transition()
  //             .duration(750)
  //             .call(zoom.transform, targetTransform);
  //     }
  // }

  // --- 调试结束 ---
  // --- 聚焦逻辑结束 ---

  // 绘制水平连线
  const links = g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal() // 使用水平链接生成器
      .x(d => d.y - layoutWidth / 2 + 200) // 交换x/y坐标
      .y(d => d.x - height / 2 + 50));

  // 绘制节点
  const nodes = g.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.y - layoutWidth / 2 + 200}, ${d.x - height / 2 + 50})`) // 交换坐标
    .on('click', handleNodeClick)
    // .on('click', handleNodeHover)
    .on('mouseenter', handleNodeHover)
    .on('mouseleave', handleNodeLeave);

  // 添加节点圆圈
  nodes.append('circle')
    .attr('r', 25)
    .attr('fill', d => getNodeColor(d.data))
    .attr('stroke', '#fff');

  // 添加头像/emoji
  if (showImages) {
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '20px')
      .text(d => d.data.avatar);
  }

  // 添加标签 - 适应水平布局
  if (showLabels) {
    nodes.append('text')
      .attr('dy', 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => d.data.name);

    nodes.append('text')
      .attr('dy', 55)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => d.data.occupation);
  }

  // 添加动画
  if (animate) {
    nodes.style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .style('opacity', 1);

    links.style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .style('opacity', 0.6);
  }
}


// 创建层次结构数据
function createHierarchy() {
  // 找到根节点（第一代）
  const rootNodes = familyData.nodes.filter(n => n.generation === 1);

  // 构建层次结构
  const buildChildren = (parentId) => {
    const children = familyData.nodes.filter(n =>
      n.parents && n.parents.includes(parentId)
    );

    return children.map(child => ({
      ...child,
      children: buildChildren(child.id)
    }));
  };

  return {
    name: rootNodes[0].name,
    ...rootNodes[0],
    children: buildChildren(rootNodes[0].id)
  };
}

// 获取节点颜色
function getNodeColor(node) {
  if (selectedNode && selectedNode.id === node.id) {
    return '#FF9800';
  }
  return node.gender === 'male' ? '#4CAF50' : '#E91E63';
}

// 处理节点点击
// 处理节点点击 (保持不变)
function handleNodeClick(event, d) {
  selectedNode = d.data;
  renderTree(); // 重新渲染（只高亮，不居中）
  highlightConnections(d.data);
  handleNodeHover(event, d); // 显示提示框
  // 确保点击后关闭搜索结果框
  document.getElementById('searchResults').classList.remove('active');

  const searchResults = document.getElementById('searchResults');
  searchInput.value = '';
}

// 处理节点悬停
function handleNodeHover(event, d) {
  const tooltip = document.getElementById('tooltip');
  const mainContent = document.querySelector('.main-content');
  const mainContentRect = mainContent.getBoundingClientRect();
  // 重置tooltip状态
  tooltip.classList.remove('show');
  tooltip.style.opacity = '0';

  // 设置提示框内容
  tooltip.querySelector('.tooltip-title').textContent = d.data.name;
  tooltip.querySelector('.tooltip-info').innerHTML = `
    <div>出生年份: ${d.data.birth || '未知'}</div>
    ${d.data.death ? `<div>逝世年份: ${d.data.death}</div>` : ''}
    <div>职业: ${d.data.occupation || '未知'}</div>
    <div>第${d.data.generation}代</div>
`;

  // 获取SVG元素及其变换矩阵
  const svg = document.querySelector('#family-tree svg');
  const svgRect = svg.getBoundingClientRect();

  // 获取节点组的transform属性
  const nodeGroup = event.currentTarget;
  const nodeTransform = d3.select(nodeGroup).attr('transform');

  // 解析节点的本地坐标
  let localX = 0, localY = 0;
  const match = nodeTransform.match(/translate\(([^,]+),([^)]+)\)/);
  if (match) {
    localX = parseFloat(match[1]);
    localY = parseFloat(match[2]);
  }

  // 获取主g元素的transform（包含缩放和平移）
  const mainG = d3.select('#family-tree svg g');
  const mainTransform = mainG.attr('transform') || '';

  // 解析transform矩阵，考虑缩放
  let scale = 1, translateX = 0, translateY = 0;

  // 尝试解析matrix变换
  const matrixMatch = mainTransform.match(/matrix\(([^)]+)\)/);
  if (matrixMatch) {
    const matrixValues = matrixMatch[1].split(',').map(parseFloat);
    scale = matrixValues[0]; // 缩放因子
    translateX = matrixValues[4]; // X平移
    translateY = matrixValues[5]; // Y平移
  } else {
    // 尝试解析translate变换
    const translateMatch = mainTransform.match(/translate\(([^,]+),([^)]+)\)/);
    if (translateMatch) {
      translateX = parseFloat(translateMatch[1]);
      translateY = parseFloat(translateMatch[2]);
    }
  }

  // 计算节点在SVG中的实际坐标（考虑缩放）
  const svgX = localX * scale + translateX;
  const svgY = localY * scale + translateY;

  // 转换为相对于main-content的坐标
  const nodeX = svgX + svgRect.left - mainContentRect.left;
  const nodeY = svgY + svgRect.top - mainContentRect.top;

  // 节点半径（考虑缩放）
  const nodeRadius = 25 * scale;

  // 计算提示框位置：从节点右边缘开始
  let tooltipX = nodeX + nodeRadius + 10 * scale;
  let tooltipY = nodeY - nodeRadius - 20 * scale; // 稍微向上偏移，使提示框中心对齐节点中心

  // 先显示tooltip以获取其尺寸
  tooltip.classList.add('show');
  tooltip.style.opacity = '0';
  const tooltipRect = tooltip.getBoundingClientRect();
  tooltip.style.opacity = '';

  // 边界检测
  const viewportWidth = mainContentRect.width;
  const viewportHeight = mainContentRect.height;

  // 水平边界检测
  if (tooltipX + tooltipRect.width > viewportWidth) {
    // 如果右侧空间不足，显示在节点左侧
    tooltipX = nodeX - nodeRadius - tooltipRect.width - 10;
  }

  // 垂直边界检测
  if (tooltipY + tooltipRect.height > viewportHeight) {
    // 如果下方空间不足，显示在节点上方
    tooltipY = nodeY - tooltipRect.height - 10;
  }

  // 确保不会超出左边界
  if (tooltipX < 10) {
    tooltipX = 10;
  }

  // 确保不会超出顶部
  if (tooltipY < 10) {
    tooltipY = 10;
  }

  // 设置最终位置
  tooltip.style.left = tooltipX + 'px';
  tooltip.style.top = tooltipY + 'px';

  // 确保tooltip是可见的
  tooltip.style.opacity = '1';
  tooltip.classList.add('show');
}


// 处理节点离开
function handleNodeLeave() {
  // document.getElementById('tooltip').classList.remove('show');
  const tooltip = document.getElementById('tooltip');
  tooltip.classList.remove('show');
  tooltip.style.opacity = '0'; // 添加这行，确保opacity被重置
  tooltip.style.left = ''; // 重置位置
  tooltip.style.top = ''; // 重置位置
}

// 高亮连接
function highlightConnections(node) {
  g.selectAll('.link')
    .classed('highlighted', d =>
      d.source.id === node.id || d.target.id === node.id
    );
}

// 搜索功能
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    if (query.length === 0) {
      searchResults.classList.remove('active');
      return;
    }

    const matches = familyData.nodes.filter(node =>
      node.name.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      searchResults.innerHTML = matches.map(node => `
                    <div class="search-result-item" data-id="${node.id}">
                        <span>${node.avatar}</span>
                        <div>
                            <div>${node.name}</div>
                            <small style="color: #999;">${node.occupation} · 第${node.generation}代</small>
                        </div>
                    </div>
                `).join('');

      searchResults.classList.add('active');

      // 添加点击事件
      searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const nodeId = parseInt(item.dataset.id);
          const node = familyData.nodes.find(n => n.id === nodeId);
          selectedNode = node;
          // --- 关键修改 ---
          // 重新渲染树形布局，这会触发我们之前修改过的聚焦逻辑
          renderTree();
          highlightConnections(node);
          // 点击后清理旧的提示框
          // handleNodeLeave();
          // 2. 将节点放置到中央 (调用 focusOnNodeBySearch 来实现居中)
          focusOnNodeBySearch(node);
          // 命中节点
          // focusOnNodeBySearch(node);
          // 3. 显示该节点的提示信息 (手动模拟悬停事件，并延迟执行)
          // 由于居中动画需要 750ms，我们延迟 800ms 来确保在正确位置显示提示框
          setTimeout(() => {
            // 更精确地查找 DOM 元素：我们选择所有的 '.node' 元素，并使用 D3 的数据绑定过滤出 ID 匹配的那个
            const targetNodeElement = d3.selectAll('g.node').filter(function (d) {
              // 检查当前绑定的数据 d 是否存在，并且 d.data.id 是否匹配我们搜索到的 node.id
              return d && d.data && d.data.id === node.id;
            });

            // 检查是否成功找到元素
            if (!targetNodeElement.empty()) {
              // 找到后，模拟 D3 事件对象
              const mockD3Event = {
                currentTarget: targetNodeElement.node(), // 必需：指向 DOM 元素
                target: targetNodeElement.node(),
              };
              // 调用悬停处理函数来显示提示框，d 参数需要是一个包含数据的对象
              handleNodeHover(mockD3Event, targetNodeElement.datum()); // 使用 targetNodeElement.datum() 获取 D3 绑定的数据
            }
          }, 800); // 延迟时间

          // --- 关键修改：在手机端时隐藏侧边栏 ---
          // 检查窗口宽度是否小于768px（即手机端）
          if (window.innerWidth < 768) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
              sidebar.classList.remove('open'); // 移除'open'类来隐藏侧边栏
            }
          }
          // --- 修改结束 ---
          // 不清空搜索内容
          // searchResults.classList.remove('active');
          // searchInput.value = '';
        });
      });
    } else {
      searchResults.innerHTML = '<div class="search-result-item">没有找到匹配的成员</div>';
      searchResults.classList.add('active');
    }
  });

  // 点击外部关闭搜索结果
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.classList.remove('active');
    }
  });
}

// 聚焦到节点
// 聚焦到节点
// 聚焦到节点
function focusOnNode(node) {
  const width = document.getElementById('family-tree').clientWidth;
  const height = document.getElementById('family-tree').clientHeight;

  const transform = d3.zoomIdentity
    .translate(100, height / 2) // 调整聚焦位置
    .scale(1);

  svg.transition()
    .duration(750)
    .call(d3.zoom().transform, transform);
}

// 聚焦到节点
function focusOnNodeBySearch(node) {
  if (!node) return;

  const width = document.getElementById('family-tree').clientWidth;
  const height = document.getElementById('family-tree').clientHeight;

  // 获取当前布局信息
  const generations = [...new Set(familyData.nodes.map(n => n.generation))].length;
  const layoutWidth = generations * 200 + 400;

  // 创建层次结构来获取节点位置
  const hierarchyData = createHierarchy();
  const root = d3.hierarchy(hierarchyData);
  const treeLayout = d3.tree()
    .size([height - 100, layoutWidth])
    .nodeSize([50, 150])
    .separation((a, b) => (a.parent == b.parent ? 1.4 : 1.4));

  treeLayout(root);

  // 找到目标节点
  const targetDescendant = root.descendants().find(d => d.data.id === node.id);

  if (targetDescendant) {
    // 计算节点位置
    const nodeX = targetDescendant.y - layoutWidth / 2 + 200;
    const nodeY = targetDescendant.x - height / 2 + 50;

    // 计算变换矩阵，使节点居中
    const targetTransform = d3.zoomIdentity
      .translate(width / 2 - nodeX, height / 2 - nodeY)
      .scale(1.0); // 适当放大

    // 应用变换
    svg.transition()
      .duration(550)
      .call(zoom.transform, targetTransform);
  }
}




// 设置事件监听器
function setupEventListeners() {
  // 搜索功能
  setupSearch();

  // 修复1：缩放控制 - 使用保存的zoom实例
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    svg.transition().call(
      zoom.scaleBy, 1.3
    );
  });

  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    svg.transition().call(
      zoom.scaleBy, 0.7
    );
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    // const width = document.getElementById('family-tree').clientWidth;
    // const height = document.getElementById('family-tree').clientHeight;

    // svg.transition().duration(750).call(
    //   zoom.transform,
    //   d3.zoomIdentity.translate(100, height / 2) // 调整初始位置
    // );

    handleNodeLeave();
    const searchResults = document.getElementById('searchResults');
    searchInput.value = '';

    // 在全局变量区域添加
    let defaultFocusNodeId = 1; // 设置默认聚焦的节点ID（例如颜之推）
    // 设置初始焦点
    const defaultNode = familyData.nodes.find(n => n.id === defaultFocusNodeId);
    if (defaultNode) {
      selectedNode = defaultNode;
      // 延迟执行以确保渲染完成
      setTimeout(() => {
        focusOnNodeBySearch(defaultNode);
        highlightConnections(defaultNode);
      }, 500);
    }
  });


  // 布局切换
  document.querySelectorAll('[data-layout]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-layout]').forEach(b =>
        b.classList.remove('active')
      );
      btn.classList.add('active');
      currentLayout = btn.dataset.layout;

      if (currentLayout === 'tree') {
        renderTree();
      } else if (currentLayout === 'radial') {
        renderRadial();
      } else if (currentLayout === 'force') {
        renderForce();
      }
    });
  });

  // 显示选项
  document.getElementById('showLabelsBtn').addEventListener('click', function () {
    showLabels = !showLabels;
    this.classList.toggle('active');
    renderTree();
  });

  document.getElementById('showImagesBtn').addEventListener('click', function () {
    showImages = !showImages;
    this.classList.toggle('active');
    renderTree();
  });

  document.getElementById('animateBtn').addEventListener('click', function () {
    animate = !animate;
    this.classList.toggle('active');
    renderTree();
  });

  // 修复2：菜单切换功能
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
    });
  }
}

// 渲染径向布局
function renderRadial() {
  g.selectAll('*').remove();

  const width = document.getElementById('family-tree').clientWidth;
  const height = document.getElementById('family-tree').clientHeight;
  const radius = Math.min(width, height) / 2 - 100;

  const hierarchyData = createHierarchy();
  const root = d3.hierarchy(hierarchyData);

  const treeLayout = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  treeLayout(root);

  // 绘制连线
  g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkRadial()
      .angle(d => d.x)
      .radius(d => d.y));

  // 绘制节点
  const nodes = g.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.y}, 0)
            `)
    .on('click', handleNodeClick)
    // .on('click', handleNodeHover)
    .on('mouseenter', handleNodeHover)
    .on('mouseleave', handleNodeLeave);

  nodes.append('circle')
    .attr('r', 20)
    .attr('fill', d => getNodeColor(d.data))
    .attr('stroke', '#fff');

  if (showImages) {
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '16px')
      .text(d => d.data.avatar);
  }

  if (showLabels) {
    nodes.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90})`)
      .style('font-size', '10px')
      .text(d => d.data.name);
  }
}

// 渲染力导向布局
function renderForce() {
  g.selectAll('*').remove();

  const width = document.getElementById('family-tree').clientWidth;
  const height = document.getElementById('family-tree').clientHeight;

  // 创建力导向模拟
  simulation = d3.forceSimulation(familyData.nodes)
    .force('link', d3.forceLink(familyData.links)
      .id(d => d.id)
      .distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide().radius(30));

  // 绘制连线
  const link = g.selectAll('.link')
    .data(familyData.links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .style('stroke', d => d.type === 'spouse' ? '#E91E63' : '#ccc')
    .style('stroke-width', d => d.type === 'spouse' ? 3 : 2);

  // 绘制节点
  const node = g.selectAll('.node')
    .data(familyData.nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))
    .on('click', handleNodeClick)
    // .on('click', handleNodeHover)
    .on('mouseenter', handleNodeHover)
    .on('mouseleave', handleNodeLeave);

  node.append('circle')
    .attr('r', 25)
    .attr('fill', d => getNodeColor(d))
    .attr('stroke', '#fff');

  if (showImages) {
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '20px')
      .text(d => d.avatar);
  }

  if (showLabels) {
    node.append('text')
      .attr('dy', 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(d => d.name);
  }

  // 更新位置
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  });

  // 拖拽函数
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

// 更新统计信息
function updateStats() {
  document.getElementById('totalMembers').textContent = familyData.nodes.length;

  const generations = new Set(familyData.nodes.map(n => n.generation));
  document.getElementById('generations').textContent = generations.size;

  const families = familyData.links.filter(l => l.type === 'spouse').length;
  document.getElementById('families').textContent = families;
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 响应窗口大小变化
window.addEventListener('resize', () => {
  const container = document.getElementById('family-tree');
  const width = container.clientWidth;
  const height = container.clientHeight;

  svg.attr('width', width).attr('height', height);

  if (currentLayout === 'tree') {
    renderTree();
  } else if (currentLayout === 'radial') {
    renderRadial();
  } else if (currentLayout === 'force') {
    renderForce();
  }
});