// http://stackoverflow.com/questions/29951130/

var Mixer = {
  color: {
    names: ['green', 'blue', 'orange', 'gold'],
    rgb: {
      green: { r: 15, g: 167, b: 73 },
      blue: { r: 0, g: 152, b: 215 },
      orange: { r: 243, g: 123, b: 38 },
      gold: { r: 255, g: 230, b: 101 }
    }
  },
  style: {
    swatch: { width: 150, height: 90, margin: { right: 15 } },
    slider: { height: 20 },
    handle: { width: 20, height: 34 }
  }
};

Mixer.toHex2 = function (decimal) {
  var hex = decimal.toString(16);
  return (hex.length == 1 ? '0'+hex : hex);
};

Mixer.toCSS = function (rgb) {
  var g = Mixer,
      toHex2 = g.toHex2;
  var parts = [ '#', toHex2(rgb.r), toHex2(rgb.g), toHex2(rgb.b) ];
  return parts.join('');
};

Mixer.toString = function (rgb) {
  return 'rgb(' + [rgb.r, rgb.g, rgb.b].join(', ') + ')';
};

Mixer.makeUnselectable = function (element) {
  element.className += ' unselectable';
  element.ondragstart = element.onselectstart = function (event) {
    event.preventDefault();
  };
};

Mixer.makeElement = function (tag, className, innerHTML, unselectable) {
  var g = Mixer,
      element = document.createElement(tag);
  element.className = (className ? className : '');
  element.innerHTML = (innerHTML ? innerHTML : '');
  if (unselectable) {
    g.makeUnselectable(element);
  }
  return element;
};

Mixer.handleDown = function (event) {
  event = event || window.event;
  var g = Mixer;
  g.mouseX = { depart: event.screenX };
  g.activeHandle = this;
  window.onmousemove = Mixer.handleMove;
  window.onmouseup = Mixer.handleUp;
};
Mixer.handleMove = function (event) {
  event = event || window.event;
  var g = Mixer,
      handle = g.activeHandle,
      pos = handle.pos,
      handles = g.handles,
      num = g.num,
      slider = g.slider,
      proportion = g.proportion,
      segments = g.segments,
      handleWidth = g.style.handle.width,
      swatches = g.swatches,
      canvas = g.canvas,
      context = g.context,
      limit = {
        min: (pos == 0 ? 0 : handles[pos-1].right),
        max: (pos == num-2 ? slider.length.total : handles[pos+1].left) -
            handleWidth
      },
      mouseX = g.mouseX;
  mouseX.current = event.screenX;
  var left = handle.left + mouseX.current - mouseX.depart;
  if (left < limit.min) {
    left = limit.min;
  }
  if (left > limit.max) {
    left = limit.max;
  }
  handle.newLeft = left;
  segments[pos] = left - limit.min;
  context.fillStyle = swatches[pos].css;
  context.fillRect(limit.min, 0, segments[pos], canvas.height);
  segments[pos+1] = limit.max - left;
  context.fillStyle = swatches[pos+1].css;
  context.fillRect(left + handleWidth, 0, segments[pos+1], canvas.height);
  handle.style.left = left + 'px';
  var segmentSpan = segments[pos] + segments[pos+1],
      proportionSpan = proportion[pos] + proportion[pos+1];
  proportion[pos] = Math.round(segments[pos]/segmentSpan * proportionSpan);
  proportion[pos+1] = proportionSpan - proportion[pos];
  swatches[pos].percent.innerHTML = proportion[pos] + '%';
  swatches[pos+1].percent.innerHTML = proportion[pos+1] + '%';
};
Mixer.handleUp = function (event) {
  var g = Mixer,
      handle = g.activeHandle;
  window.onmousemove = null;
  window.onmouseup = null;
  handle.left = handle.newLeft;
  handle.right = handle.left + g.style.handle.width;
};

Mixer.load = function () {
  var g = Mixer,
      style = g.style;

  // Make color swatches.
  var palette = g.palette = document.getElementById('palette'),
      names = g.color.names,
      swatches = g.swatches = [],
      num = g.num = names.length;
  for (var i = 0; i < num; ++i) {
    var name = names[i],
        rgb = g.color.rgb[name],
        css = g.toCSS(rgb),
        container = g.makeElement('div', 'swatchContainer', '', true),
        percent = g.makeElement('div', 'percent', '', true),
        swatch = g.makeElement('div', 'swatch', '', true);
    swatches[i] = { css: css, percent: percent };
    container.appendChild(percent);
    swatch.style.backgroundColor = css;
    swatch.style.width = style.swatch.width + 'px';
    swatch.style.height = style.swatch.height + 'px';
    swatch.style.marginRight = style.swatch.margin.right + 'px';
    container.appendChild(swatch);
    container.appendChild(g.makeElement('div', 'label', g.toString(rgb), true));
    container.appendChild(g.makeElement('div', 'label', css, true));
    palette.appendChild(container);
  }

  // Initialize proportions.
  var blend = g.blend = {
        superimpose: document.getElementById('superimpose'),
        average: document.getElementById('average')
      },
      proportion = g.proportion = new Array(num),
      each = Math.floor(100/num);
  for (var i = 0; i < num-1; ++i) {
    proportion[i] = each;
  }
  proportion[num-1] = 100 - (num-1)*each;
  for (var i = 0; i < num; ++i) {
    swatches[i].percent.innerHTML = proportion[i] + '%';
  }

  // Assemble the slider widget.
  var slider = g.slider = document.getElementById('slider');
  slider.length = {
    total: num*style.swatch.width + (num-1)*style.swatch.margin.right
  };
  slider.length.free = slider.length.total - (num-1)*style.handle.width;
  var segments = g.segments = new Array(num);
  var tail = slider.length.free;
  for (var i = 0; i < num-1; ++i) {
    var current = Math.round(proportion[i]/100*slider.length.free);
    segments[i] = current;
    tail -= current;
  }
  segments[num-1] = tail;
  slider.style.width = slider.length.total + 'px';
  slider.style.height = style.slider.height + 'px';
  var canvas = g.canvas = g.makeElement('canvas'),
      context = g.context = canvas.getContext('2d');
  g.makeUnselectable(slider);
  g.makeUnselectable(canvas);
  canvas.width = slider.length.total;
  canvas.height = style.slider.height;
  slider.appendChild(canvas);
  var handles = g.handles = new Array(num-1);
  var left = 0;
  for (var i = 0; i < num; ++i) {
    context.fillStyle = swatches[i].css;
    context.fillRect(left, 0, segments[i], canvas.height);
    if (i == num-1) {
      break;
    }
    var handle = handles[i] = g.makeElement('div', 'handle', '', true);
    handle.pos = i;
    handle.style.width = style.handle.width + 'px';
    handle.style.height = style.handle.height + 'px';
    handle.style.top = (style.slider.height - style.handle.height)/2 + 'px';
    handle.left = left + segments[i];
    handle.style.left = handle.left + 'px';
    handle.right = handle.left + style.handle.width;
    left = handle.right;
    handle.onmousedown = g.handleDown;
    slider.appendChild(handle);
  }
};

window.onload = Mixer.load;
