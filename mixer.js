var Mixer = (function () {
  var color = {
        names: ['green', 'blue', 'orange', 'gold'],
        rgb: {
          green: { r: 15, g: 167, b: 73 },
          blue: { r: 0, g: 152, b: 215 },
          orange: { r: 243, g: 123, b: 38 },
          gold: { r: 255, g: 230, b: 101 }
        }
      },
      style = {
        swatch: { width: 150, height: 90, margin: { right: 15 } },
        slider: { height: 20 },
        handle: { width: 20, height: 34 }
      },
      handleWidth = style.handle.width,
      segments,
      proportion,
      mouseX,
      activeHandle,
      handles,
      num,
      slider,
      palette,
      blend,
      swatches,
      canvas,
      context,
      mixingFunctions;

  function toHex2(decimal) {
    var hex = decimal.toString(16);
    return (hex.length == 1 ? '0'+hex : hex);
  }

  function toCSS(rgb) {
    var parts = [ '#', toHex2(rgb.r), toHex2(rgb.g), toHex2(rgb.b) ];
    return parts.join('');
  }

  function toString(rgb) {
    return 'rgb(' + [rgb.r, rgb.g, rgb.b].join(', ') + ')';
  };

  function makeUnselectable(element) {
    element.className += ' unselectable';
    element.ondragstart = element.onselectstart = function (event) {
      event.preventDefault();
    };
  }

  function makeElement(tag, className, innerHTML, unselectable) {
    var element = document.createElement(tag);
    element.className = (className ? className : '');
    element.innerHTML = (innerHTML ? innerHTML : '');
    if (unselectable) {
      makeUnselectable(element);
    }
    return element;
  }

  function handleDown(event) {
    event = event || window.event;
    mouseX = { depart: event.screenX };
    activeHandle = this;
    window.onmousemove = handleMove;
    window.onmouseup = handleUp;
  }

  function handleMove(event) {
    event = event || window.event;
    var handle = activeHandle,
        pos = handle.pos,
        limit = {
          min: (pos == 0 ? 0 : handles[pos-1].right),
          max: (pos == num-2 ? slider.length.total : handles[pos+1].left) -
              handleWidth
        };
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
    if (segmentSpan != 0) {
      proportion[pos] = Math.round(segments[pos]/segmentSpan * proportionSpan);
      proportion[pos+1] = proportionSpan - proportion[pos];
      swatches[pos].percent.innerHTML = proportion[pos] + '%';
      swatches[pos+1].percent.innerHTML = proportion[pos+1] + '%';
    }
    mixColors();
  }

  function handleUp(event) {
    window.onmousemove = null;
    window.onmouseup = null;
    activeHandle.left = activeHandle.newLeft;
    activeHandle.right = activeHandle.left + style.handle.width;
  }

  function makeAlphaCompositingMixer(swatch, label) {
    return function () {
      var mix = {},
          subs = ['r', 'g', 'b'];
      for (var i = 0; i < subs.length; ++i) {
        var x = subs[i];
        mix[x] = swatches[0].rgb[x];
      }
      var alpha = { back: proportion[0]/100 };
      for (var pos = 1; pos < num; ++pos) {
        var fore = swatches[pos].rgb;
        alpha.fore = proportion[pos]/100,
        alpha.mix = 1 - (1-alpha.back)*(1-alpha.fore);
        if (alpha.mix >= 1.0e-6) {
          for (var i = 0; i < subs.length; ++i) {
            var x = subs[i];
            mix[x] = 255 * (fore[x]/255 * alpha.fore/alpha.mix +
                mix[x]/255 * alpha.back*(1-alpha.fore)/alpha.mix);
          }
        }
        alpha.back = alpha.mix;
      }
      for (var i = 0; i < subs.length; ++i) {
        var x = subs[i];
        mix[x] = Math.round(mix[x]);
      }
      var css = toCSS(mix);
      label.rgb.innerHTML = toString(mix);
      label.css.innerHTML = css;
      swatch.style.backgroundColor = css;
      swatch.style.opacity = alpha.mix;
    };
  }

  function makeWeightedAverageMixer(swatch, label) {
    return function () {
      var mix = { r: 0, g: 0, b: 0 },
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
      var css = toCSS(mix);
      label.rgb.innerHTML = toString(mix);
      label.css.innerHTML = css;
      swatch.style.backgroundColor = css;
    };
  }

  function mixColors() {
    var i;
    for (i = 0; i < mixingFunctions.length; ++i) {
      mixingFunctions[i]();
    }
  }

  function load() {
    // Make color swatches.
    var names = color.names;
    num = names.length;
    palette = document.getElementById('palette');
    swatches = [];
    for (var i = 0; i < num; ++i) {
      var name = names[i],
          rgb = color.rgb[name],
          css = toCSS(rgb),
          container = makeElement('div', 'swatchContainer', '', true),
          percent = makeElement('div', 'title', '', true),
          swatch = makeElement('div', 'swatch', '', true);
      swatches[i] = { rgb: rgb, css: css, percent: percent };
      container.appendChild(percent);
      swatch.style.backgroundColor = css;
      swatch.style.width = style.swatch.width + 'px';
      swatch.style.height = style.swatch.height + 'px';
      swatch.style.marginRight = style.swatch.margin.right + 'px';
      container.appendChild(swatch);
      container.appendChild(makeElement('div', 'label',
            toString(rgb), true));
      container.appendChild(makeElement('div', 'label', css, true));
      palette.appendChild(container);
    }
    var totalWidth = num*style.swatch.width + (num-1)*style.swatch.margin.right;

    // Initialize proportions.
    var each = Math.floor(100/num);
    proportion = new Array(num);
    for (var i = 0; i < num-1; ++i) {
      proportion[i] = each;
    }
    proportion[num-1] = 100 - (num-1)*each;
    for (var i = 0; i < num; ++i) {
      swatches[i].percent.innerHTML = proportion[i] + '%';
    }

    // Prepare the blended swatches.
    var mixers = ['alpha compositing', 'weighted average'],
        between = (totalWidth - mixers.length*style.swatch.width) /
            (mixers.length + 1);
    blend = { container: document.getElementById('blend') };
    makeUnselectable(blend);
    blend.container.style.width = totalWidth + 'px';
    blend.container.style.height = style.swatch.height + 'px';
    mixingFunctions = [];
    for (var i = 0; i < mixers.length; ++i) {
      var mixer = mixers[i],
          container = makeElement('div', 'swatchContainer', '', true),
          title = makeElement('div', 'title', mixer, true),
          swatch = makeElement('div', 'swatch', '', true),
          label = {
            rgb: makeElement('div', 'label', '', true),
            css: makeElement('div', 'label', '', true)
          };
      swatch.style.width = style.swatch.width + 'px';
      swatch.style.height = style.swatch.height + 'px';
      container.style.left = i*style.swatch.width + (i+1)*between + 'px';
      container.appendChild(title);
      container.appendChild(swatch);
      container.appendChild(label.rgb);
      container.appendChild(label.css);
      blend.container.appendChild(container);
      if (mixer == 'alpha compositing') {
        mixingFunctions.push(makeAlphaCompositingMixer(swatch, label));
      } else {
        mixingFunctions.push(makeWeightedAverageMixer(swatch, label));
      }
    }

    // Assemble the slider widget.
    slider = document.getElementById('slider');
    slider.length = {
      total: totalWidth,
      free: totalWidth - (num-1)*style.handle.width
    };
    segments = new Array(num);
    var tail = slider.length.free;
    for (var i = 0; i < num-1; ++i) {
      var current = Math.round(proportion[i]/100*slider.length.free);
      segments[i] = current;
      tail -= current;
    }
    segments[num-1] = tail;
    slider.style.width = slider.length.total + 'px';
    slider.style.height = style.slider.height + 'px';
    canvas = makeElement('canvas');
    context = canvas.getContext('2d');
    makeUnselectable(slider);
    makeUnselectable(canvas);
    canvas.width = slider.length.total;
    canvas.height = style.slider.height;
    slider.appendChild(canvas);
    handles = new Array(num-1);
    var left = 0;
    for (var i = 0; i < num; ++i) {
      context.fillStyle = swatches[i].css;
      context.fillRect(left, 0, segments[i], canvas.height);
      if (i == num-1) {
        break;
      }
      var handle = handles[i] = makeElement('div', 'handle', '', true);
      handle.pos = i;
      handle.style.width = style.handle.width + 'px';
      handle.style.height = style.handle.height + 'px';
      handle.style.top = (style.slider.height - style.handle.height)/2 + 'px';
      handle.left = left + segments[i];
      handle.style.left = handle.left + 'px';
      handle.right = handle.left + style.handle.width;
      left = handle.right;
      handle.onmousedown = handleDown;
      slider.appendChild(handle);
    }

    mixColors();
  }

  return {
    load: load
  };
})();

onload = Mixer.load;
