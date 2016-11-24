# Color blending demo

## How to make a new color from a combination of existing colors

This web page was written to answer a Stack Overflow question:

http://stackoverflow.com/questions/29951130/how-can-i-create-a-color-with-values-for-green-blue-orange-and-gold-only/

The page presents a palette of four predefined colors that are mixed with
two methods&mdash;alpha compositing and weighted average&mdash;to make
a pair of new colors. To adjust the proportions of the palette colors,
slide the black handles in the mixing bar above the palette.

- **Alpha compositing**: Each palette color is assigned an opacity
value that is equal to the fraction of the mixing bar filled with that
color. Suppose we have a stack of color layers with those opacities. We
calculate the overall color that results from shining a light through
the color stack.

- **Weighted average**: Each palette color is assigned a weight that is
equal to the fraction of the mixing bar filled with that color. We use
these weights to compute the weighted average of the RGB values.

![Color blending demo](screenshot.png)

