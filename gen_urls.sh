#!/bin/sh

# 备份原文件
cp README.md README.md.backup.$(date +%Y%m%d%H%M%S)

# 生成 TOC 内容
str=''
for i in `ls *.html | grep -v ' - 副本' 2>/dev/null`
do   
    if [ -n "$str" ]; then
        str="$str\n"
    fi
    str="$str$i: <https://yansheng836.github.io/figure-relationship-diagram/$i>\n"
done

# 定义标志模式
start_pattern='<!-- START_TOC_GENERATED -->'
end_pattern='<!-- END_TOC_GENERATED -->'

# 使用 awk 进行精确替换（最可靠的方法）
awk -v start="$start_pattern" \
    -v end="$end_pattern" \
    -v new_content="$str" '
    BEGIN { output=1 }
    $0 == start { 
        print $0
        print new_content
        output=0
        next
    }
    $0 == end && output == 0 {
        print $0
        output=1
        next
    }
    output == 1 { print $0 }
' README.md > README.md.tmp

# 检查并替换
if [ $? -eq 0 ] && [ -s README.md.tmp ]; then
    mv README.md.tmp README.md
    echo "TOC 更新成功！"
else
    echo "更新失败，已保留备份文件"
    rm -f README.md.tmp
fi
