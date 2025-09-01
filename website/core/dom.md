# 🌐 三套 DOM API

## dom.xx/svg.xx - 链式调用风格 (传统)

```typescript
dom
  .div({
    className: 'container',
    style: {
      color: 'red',
      backgroundColor() {
        return isActive.get() ? 'green' : 'blue'
      },
    },
  })
  .render(() => {
    //渲染文本节点
    renderTextContent('abc')
    renderTextContent(() => {
      return `abc${signalA.get()}`
    })
    renderText`abc${signalA.get}`
    //渲染html节点
    renderHtml`<b>sss${signalA.get}</b>`
    renderHtmlContent(`<b>sss</b>`)
    renderTextContent(() => {
      return `<b>sss${signalA.get()}</b>`
    })

    //渲染子区域为文字
    dom.span().renderText`abc`
    //渲染子区域为文字,但文字是动态的
    dom.span().renderTextContent(() => {
      return `${value.get()}abc`
    })

    //渲染子区域为html
    dom.span().rendrHtml`<b>abc</b>`
    dom.span().rendrHtmlContent(function () {
      //返回一段html的内容
      return `<b>${html.get()}</b>`
    })
  })
```

## fdom.xx/fsvg.xx - 扁平参数风格（推荐）

属性转换规则：`style.xxx` → `s_xxx`(如`style.backgroundColor` → `s_backgroundColor`)，`data-xxx` → `data_xxx`, ，`--xxx` → `css_xxx`，`aria-xxx` → `aria_xxx`

```typescript
fdom.div({
  className: 'container',
  s_color: 'red', // style.color
  s_backgroundColor() {
    // 动态样式
    return isActive.get() ? 'green' : 'blue'
  },
  data_testId: 'my-div', // data-testId
  data_customValue() {
    return `value-${id.get()}`
  },

  css_primaryColor: '#007bff', // --primaryColor
  css_fontSize() {
    return `${size.get()}px`
  },

  aria_label: '主要内容', // aria-label
  aria_expanded() {
    return isExpanded.get()
  },

  onClick(e) {
    /* 事件处理 */
  },

  children() {
    fdom.span({
      children: 'abc', //静态文本内容
    })
    fdom.span({
      childrenType: 'text', // 动态文本内容
      children() {
        return `动态内容: ${content.get()}`
      },
    })
    fdom.span({
      //getContent为返回文本或数字的信号函数.此时子区域动态渲染为该文本,toText来源于wy-dom-helper
      children: toText`abc--${getContent}---bcc`,
    })
    fdom.span({
      //getContent为返回文本或数字的信号函数.此时子区域动态渲染为该文本 toGetText来源于wy-dom-helper
      children: toGetText(function () {
        return `abc--${getContent()}---bcc`
      }),
    })

    fdom.span({
      childrenType: 'html', // HTML 内容
      children() {
        return `<b>${content.get()}</b>`
      },
    })
    fdom.span({
      //getContent为返回文本或数字的信号函数.此时子区域动态渲染为html,toHtml来源于wy-dom-helper
      children: toHtml`<b>abc--${getContent}---bcc</b>`,
    })
    fdom.span({
      //getContent为返回文本或数字的信号函数.此时子区域动态渲染为html,toGetHtml来源于wy-dom-helper
      children: toGetHtml(function () {
        return `<b>abc--${getContent()}---bcc</b>`
      }),
    })
  },
})
```

## mdom.xx/msvg.xx - 减少重复依赖(相对 fdom)

当多个属性依赖相同信号时，减少 trackSignal 建立：

```typescript
mdom.div({
  attrs(m) {
    if (isActive.get()) {
      m.s_color = 'red'
      m.s_backgroundColor = 'green'
      m.data_status = 'active'
    } else {
      m.s_color = 'blue'
      m.s_backgroundColor = 'yellow'
      m.data_status = 'inactive'
    }
  },
  onClick(e) {
    /*事件 */
  },
  children() {
    // children 用法与 fdom 相同,包括存在的childrenType
  },
})
```
