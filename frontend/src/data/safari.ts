export type SafariPhoto = {
  src: string;
  alt: string;
  iso: string;
  aperture: string;
  shutter: string;
  camera: string;
  lens: string;
  location: string;
};

// Source: extracted from https://www.rohanghosh.co.uk/safari (Format CDN)
// These are sample images for development. We'll replace with a proper CMS-backed library.
export const safariPhotos: SafariPhoto[] = [
  {
    src: "https://format.creatorcdn.com/46e4c700-aba6-422f-b069-086ecd5bdd8a/0/0/0/0,0,1596,1140,1600,1140/0-0-0/70fcbc03-fe92-4a12-af3e-df9f33016bfd/1/1/IMG_1053.jpg?fjkss=exp=2084056235~hmac=c97be31b9a3aca57ae5d923d6214e7ed345a05a204d10b82290a021cde0c2da0",
    alt: "Safari — Masai Mara (IMG_1053)",
    iso: "400",
    aperture: "f/5.6",
    shutter: "1/1000",
    camera: "Leica Q2",
    lens: "28mm f/1.7",
    location: "Masai Mara, Kenya",
  },
  {
    src: "https://format.creatorcdn.com/46e4c700-aba6-422f-b069-086ecd5bdd8a/0/0/0/0,0,1753,1140,1600,1140/0-0-0/eba7fc63-7b8b-40d0-a426-ef23410a41de/1/1/IMG_1023.jpg?fjkss=exp=2084056235~hmac=5e17cf9ad7c28594c978c035e39a19941c2d8235a2476e726687bc80bacbea60",
    alt: "Safari — Masai Mara (IMG_1023)",
    iso: "200",
    aperture: "f/8.0",
    shutter: "1/500",
    camera: "Leica Q2",
    lens: "28mm f/1.7",
    location: "Masai Mara, Kenya",
  },
  {
    src: "https://format.creatorcdn.com/46e4c700-aba6-422f-b069-086ecd5bdd8a/0/0/0/0,0,1596,1140,1600,1140/0-0-0/9b1f3059-f18b-4b84-9d16-1ccf5f10101a/1/1/IMG_9882.jpg?fjkss=exp=2084056235~hmac=c97be31b9a3aca57ae5d923d6214e7ed345a05a204d10b82290a021cde0c2da0",
    alt: "Safari — Masai Mara (IMG_9882)",
    iso: "320",
    aperture: "f/4.0",
    shutter: "1/800",
    camera: "Leica Q2",
    lens: "28mm f/1.7",
    location: "Masai Mara, Kenya",
  },
  {
    src: "https://format.creatorcdn.com/46e4c700-aba6-422f-b069-086ecd5bdd8a/0/0/0/0,0,1140,1140,1600,1140/0-0-0/ddcd45e4-0a60-4314-8eef-e65cbbc5ca7b/1/1/IMG_1338.jpg?fjkss=exp=2084056235~hmac=214090041436174b51d7823b4d9c7a51960c199b132a07c7cc518bf3cb8ffea4",
    alt: "Safari — Masai Mara (IMG_1338)",
    iso: "500",
    aperture: "f/6.3",
    shutter: "1/640",
    camera: "Leica Q2",
    lens: "28mm f/1.7",
    location: "Masai Mara, Kenya",
  },
];
