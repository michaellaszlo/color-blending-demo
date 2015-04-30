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
      mixingFunctions = g.mixingFunctions,
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
  g.mixColors();
};
Mixer.handleUp = function (event) {
  var g = Mixer,
      handle = g.activeHandle;
  window.onmousemove = null;
  window.onmouseup = null;
  handle.left = handle.newLeft;
  handle.right = handle.left + g.style.handle.width;
};

Mixer.makeFunctionName = function (title) {
  var parts = ['mix'],
      tokens = title.split(' ');
  for (var i = 0; i < tokens.length; ++i) {
    var token = tokens[i];
    parts.push(token[0].toUpperCase() + token.substring(1));
  }
  return parts.join('');
};

Mixer.mixAlphaCompositing = function (swatch, label) {
  return function () {
    var g = Mixer,
        swatches = g.swatches,
        proportion = g.proportion,
        num = g.num,
        mix = {},
        subs = ['r', 'g', 'b'];
    for (var i = 0; i < subs.length; ++i) {
      var x = subs[i];
      mix[x] = swatches[0].rgb[x];
    }
    var alpha = { back: proportion[0]/100 };
    for (var pos = 1; pos < num; ++pos) {
      var color = swatches[pos].rgb;
      alpha.fore = proportion[pos]/100,
      alpha.mix = 1 - (1-alpha.fore)*(1-alpha.back);
      if (alpha.mix >= 1.0e-6) {
        for (var i = 0; i < subs.length; ++i) {
          var x = subs[i];
          mix[x] = 255 * (color[x]/255 * alpha.fore / alpha.mix +
              mix[x]/255 * alpha.back * (1 - alpha.fore) / alpha.mix);
        }
      }
      alpha.back = alpha.mix;
    }
    for (var i = 0; i < subs.length; ++i) {
      var x = subs[i];
      mix[x] = Math.round(mix[x]);
    }
    var css = g.toCSS(mix);
    label.rgb.innerHTML = g.toString(mix);
    label.css.innerHTML = css;
    swatch.style.backgroundColor = css;
  };
};

Mixer.mixWeightedAverage = function (swatch, label) {
  return function () {
    var g = Mixer,
        swatches = g.swatches,
        proportion = g.proportion,
        num = g.num,
        mix = { r: 0, g: 0, b: 0 },
        subs = ['r', 'g', 'b'];
    for (var pos = 0; pos < num; ++pos) {
      for (var i = 0; i < subs.length; ++i) {
        var x = subs[i];
        mix[x] += proportion[pos]/100 * swatches[pos].rgb[x];
      }
    }
    for (var i = 0; i < subs.length; ++i) {
      var x = subs[i];
      mix[x] = Math.round(mix[x]);
    }
    var css = g.toCSS(mix);
    label.rgb.innerHTML = g.toString(mix);
    label.css.innerHTML = css;
    swatch.style.backgroundColor = css;
  };
};

Mixer.mixColors = function () {
  var g = Mixer,
      mixingFunctions = g.mixingFunctions;
  for (var i = 0; i < mixingFunctions.length; ++i) {
    mixingFunctions[i]();
  }
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
        percent = g.makeElement('div', 'title', '', true),
        swatch = g.makeElement('div', 'swatch', '', true);
    swatches[i] = { rgb: rgb, css: css, percent: percent };
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
  var totalWidth = num*style.swatch.width + (num-1)*style.swatch.margin.right;

  // Initialize proportions.
  var proportion = g.proportion = new Array(num),
      each = Math.floor(100/num);
  for (var i = 0; i < num-1; ++i) {
    proportion[i] = each;
  }
  proportion[num-1] = 100 - (num-1)*each;
  for (var i = 0; i < num; ++i) {
    swatches[i].percent.innerHTML = proportion[i] + '%';
  }

  // Prepare the blended swatches.
  var blend = g.blend = { container: document.getElementById('blend') },
      mixers = ['alpha compositing', 'weighted average'],
      between = (totalWidth - mixers.length*style.swatch.width) /
          (mixers.length + 1);
  g.makeUnselectable(blend);
  blend.container.style.width = totalWidth + 'px';
  blend.container.style.height = style.swatch.height + 'px';
  g.mixingFunctions = [];
  for (var i = 0; i < mixers.length; ++i) {
    var mixer = mixers[i],
        container = g.makeElement('div', 'swatchContainer', '', true),
        title = g.makeElement('div', 'title', mixer, true),
        swatch = g.makeElement('div', 'swatch', '', true),
        label = {
          rgb: g.makeElement('div', 'label', '', true),
          css: g.makeElement('div', 'label', '', true)
        };
    swatch.style.width = style.swatch.width + 'px';
    swatch.style.height = style.swatch.height + 'px';
    container.style.left = i*style.swatch.width + (i+1)*between + 'px';
    container.appendChild(title);
    container.appendChild(swatch);
    container.appendChild(label.rgb);
    container.appendChild(label.css);
    blend.container.appendChild(container);
    var functionName = g.makeFunctionName(mixer),
        mixingFunction = g[functionName](swatch, label);
    g.mixingFunctions.push(mixingFunction);
  }

  // Assemble the slider widget.
  var slider = g.slider = document.getElementById('slider');
  slider.length = {
    total: totalWidth,
    free: totalWidth - (num-1)*style.handle.width
  };
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

  g.mixColors();
};

window.onload = Mixer.load;
