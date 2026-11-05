# Trademarks

The MIT license (`LICENSE`) covers the code. It gives no rights to Percent's name or brand:

- the name "Percent";
- the Percent logo in every version: the % icon (`Mark`), the Arabic and English wordmarks (`Logo`), the logo loader (`LogoLoader`), the SVG files in `apps/docs/public/brand/`, the videos in `apps/docs/public/brand-video/` and in the `brand-video` release, and the % spinner shape;
- the look of Percent's own websites and products as a whole.

You can use the components in any project. The Percent brand is the default, so your project shows the % mark until you set your own:

```tsx
<PercentProvider lang="en" brand={{ mark: <YourMark />, wordmark: <YourWordmark /> }}>
```

With a `brand`, the spinner is a plain ring unless you give your own `spinner`. Before you ship a product that is not Percent's, set your brand, and do not suggest that Percent made or endorses your product.

Questions: contact@percent.sa
