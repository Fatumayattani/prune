# Third-party notices

## EZ-Tree

The tree generator (`src/shared/tree/`), leaf wind shader
(`src/client/tree/wind.ts`), tree geometry code (`src/client/tree/view.ts`)
and the bark and leaf textures (`public/textures/`) are adapted from
[EZ-Tree](https://github.com/dgreenheck/ez-tree) by Daniel Greenheck.

```text
MIT License

Copyright (c) 2024 Daniel Greenheck

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Bark texture sources listed by EZ-Tree:

- Birch: https://www.texturecan.com/details/221/
- Pine: https://www.texturecan.com/details/588/
- Oak: https://polyhaven.com/a/bark_brown_02

## webgl-noise

The simplex noise in `src/client/tree/wind.ts` is from
[webgl-noise](https://github.com/ashima/webgl-noise) (MIT).
