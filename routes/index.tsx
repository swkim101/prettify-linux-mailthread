/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "$fresh/server.ts";

interface Email {
  url: string;
  content: string;
}

const diffClasses = new Map<string, string> ([
  ["d", "font-weight: bold; border-top: 1px solid black; margin-top: 40px;"],
  ["i", "color: #aaa"],
  ["@", "color: #a0b;"],
  ["-", "background-color: #fdd"],
  ["+", "background-color: #dfd;"],
  [" ", "context"]
]);

// Thanks to: https://github.com/scottgonzalez/pretty-diff/blob/5fca83933df9d5b902fea7bf41adf12e08a603c7/pretty-diff.js#L52
const markUpDiff = (text: Array<string>) => 
  text.filter(line => {
    const type = line.charAt( 0 );
    return diffClasses.get(type) !== undefined && line.trim().length !== 0;
  }).map( line => {
    const type = line.charAt( 0 );
    return "<pre style='" + diffClasses.get(type) + "'>" + line + "</pre>";
  }).join( "\n" );

const isValidURL = (url: string) => {
  if(url.trim() === "") {
    return false 
  }
  if (!url.startsWith("https://lore.kernel.org/lkml/")) {
    return false
  }
  return true
}

export const handler: Handlers<Email | null> = {
  async GET(req, ctx) {
    const url = new URL(req.url).searchParams.get("q") || "";
    if (!isValidURL(url)) {
      return ctx.render(null)
    }
    const resp = await fetch(`${url}`);
    if (resp.status === 404) {
      return ctx.render(null);
    }
    const res = await resp.text();
    // remove <tag />
    const strippedString = res.replace(/(<([^>]+)>)/gi, "");
    const email: Email = {
      url,
      content: markUpDiff(strippedString.split('\n'))
    }
    return ctx.render(email);
  },
};


export default function Home({ data }: PageProps<Email | null>) {
  const url = data?.url;
  const btn = tw`px-2 bg-blue-200 border(black-100 1) hover:bg-blue-400 rounded`;
  const inp = tw`border(black-100 1) w-full`
  const h1 = tw`text-4xl my-10`
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <h1 class={h1}>Prettify Kernel Mailing Thread</h1>
      <form>
        <input id="username" type="text" class={inp} name="q" value={url} placeholder="e.g., https://lore.kernel.org/lkml/E17yO3f-0002MM-00@pegasus" />
        <div class={tw`my-4 flex justify-end`}>
          <button type="submit" class={btn}>Prettify!</button>
        </div>
      </form>
      { data && <div dangerouslySetInnerHTML={{ __html: data.content }} /> }
    </div>
  );
}
