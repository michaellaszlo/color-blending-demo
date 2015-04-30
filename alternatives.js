var Colors = {
  names: ['green', 'blue', 'orange', 'gold'],
  values: {
    green: { r: 15, g: 167, b: 73 },
    blue: { r: 0, g: 152, b: 215 },
    orange: { r: 243, g: 123, b: 38 },
    gold: { r: 255, g: 230, b: 101 }
  }
};

Colors.toHex2 = function (decimal) {
  var hex = decimal.toString(16);
  return (hex.length == 1 ? '0'+hex : hex);
};

Colors.toColorString = function (value) {
  var g = Colors,
      toHex2 = g.toHex2;
  var parts = [ '#', toHex2(value.r), toHex2(value.g), toHex2(value.b) ];
  return parts.join('');
};

Colors.load = function () {
  var g = Colors,
      names = g.names,
      values = g.values,
      containers = {
        separate: document.getElementById('separate'),
        dilute: document.getElementById('dilute'),
        superimpose: document.getElementById('superimpose'),
        superimposeBlack: document.getElementById('superimposeBlack'),
        blend: document.getElementById('blend')
      },
      blended = { r: 0, g: 0, b: 0 };
  document.body.style.paddingTop = 10*(1+names.length) + 'px';
  for (var i = 0; i < names.length; ++i) {
    var name = names[i],
        value = values[name],
        color = g.toColorString(value),
        swatch = document.createElement('div'),
        proportion = 1 / names.length;
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color;
    separate.appendChild(swatch);

    swatch = swatch.cloneNode();
    swatch.style.opacity = proportion;
    dilute.appendChild(swatch);

    swatch = swatch.cloneNode();
    swatch.style.height = 60 + 10*(names.length-1) + 'px';
    swatch.style.top = 10*(1+i-names.length) + 'px';
    superimpose.appendChild(swatch);
    superimposeBlack.appendChild(swatch.cloneNode());

    blended.r += proportion * value.r;
    blended.g += proportion * value.g;
    blended.b += proportion * value.b;
  }

  swatch = document.createElement('div');
  swatch.className = 'swatch';
  //swatch.style.height = 60+20*(names.length-1) + 'px';
  //swatch.style.top = 10*(1-names.length) + 'px';
  swatch.style.width = '110px';
  swatch.style.left = '-5px';
  swatch.style.background = '#000';
  swatch.style.zIndex = -10;
  superimposeBlack.appendChild(swatch);

  swatch = document.createElement('div');
  swatch.className = 'swatch';
  blended.r = Math.round(blended.r);
  blended.g = Math.round(blended.g);
  blended.b = Math.round(blended.b);
  swatch.style.backgroundColor = g.toColorString(blended);
  blend.appendChild(swatch);
};

window.onload = Colors.load;
