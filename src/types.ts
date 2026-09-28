export interface Item {
  id: string;
  /** Bold first line such as "[화면 구현과 찰떡인 개발자]". null = no heading. */
  title: string | null;
  body: string;
}

export interface Section {
  id: string;
  title: string;
  items: Item[];
}

export interface Page {
  id: string;
  sections: Section[];
}

/** 'default' = bundled asset, null = hidden, otherwise a data URL uploaded by the user. */
export type ImageSrc = 'default' | string | null;

export interface Doc {
  header: { title: string; name: string; tagline: string };
  logo: ImageSrc;
  pages: Page[];
  signature: { text: string; image: ImageSrc };
}
