import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export async function GET(context) {
  return rss({
    title: 'Shane is me blog',
    description: 'A small personal blog that gets updated randomly on occasion. Mostly about engineering management and leadership, sometimes about chairs that are conscious.',
    site: context.site,
    items: await pagesGlobToRssItems(import.meta.glob('./**/*.md')),
    customData: `<language>en-us</language>`,
  });
}