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
        original: document.getElementById('original'),
        translucent: document.getElementById('translucent'),
        layered: document.getElementById('layered'),
        layeredBlack: document.getElementById('layeredBlack'),
        averaged: document.getElementById('averaged')
      },
      averaged = { r: 0, g: 0, b: 0 };
  document.body.style.paddingTop = 10*(1+names.length) + 'px';
  for (var i = 0; i < names.length; ++i) {
    var name = names[i],
        value = values[name],
        color = g.toColorString(value),
        swatch = document.createElement('div'),
        proportion = 1 / names.length;
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color;
    containers.original.appendChild(swatch);

    swatch = swatch.cloneNode();
    swatch.style.opacity = proportion;
    containers.translucent.appendChild(swatch);

    swatch = swatch.cloneNode();
    swatch.style.height = 60 + 10*(names.length-1) + 'px';
    swatch.style.top = 10*(1+i-names.length) + 'px';
    containers.layered.appendChild(swatch);
    containers.layeredBlack.appendChild(swatch.cloneNode());

    averaged.r += proportion * value.r;
    averaged.g += proportion * value.g;
    averaged.b += proportion * value.b;
  }

  swatch = document.createElement('div');
  swatch.className = 'swatch';
  //swatch.style.height = 60+20*(names.length-1) + 'px';
  //swatch.style.top = 10*(1-names.length) + 'px';
  swatch.style.width = '110px';
  swatch.style.left = '-5px';
  swatch.style.background = '#000';
  swatch.style.zIndex = -10;
  containers.layeredBlack.appendChild(swatch);

  swatch = document.createElement('div');
  swatch.className = 'swatch';
  averaged.r = Math.round(averaged.r);
  averaged.g = Math.round(averaged.g);
  averaged.b = Math.round(averaged.b);
  swatch.style.backgroundColor = g.toColorString(averaged);
  containers.averaged.appendChild(swatch);
};

window.onload = Colors.load;
