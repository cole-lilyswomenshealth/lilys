import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Us - Lily's Women's Health",
  description: "Learn about Lily's mission to make medically guided weight loss simple, supportive, and accessible for every woman through partnership with licensed telehealth providers.",
  keywords: [
    "about Lily's",
    "women's health mission",
    "telehealth weight loss",
    "Qualiphy partnership",
    "medical weight loss story",
    "women's wellness platform",
    "licensed healthcare providers",
    "GLP-1 medication access"
  ],
  openGraph: {
    title: "About Lily's Women's Health - Our Mission",
    description: "Making medically guided weight loss simple, supportive, and accessible for every woman through secure telehealth consultations.",
    url: "https://lilyswomenshealth.com/about",
    images: [
      {
        url: "/images/about-og-image.jpg",
        width: 1200, 
        height: 630,
        alt: "About Lily's Women's Health - Our Mission"
      }
    ]
  },
  twitter: {
    title: "About Lily's Women's Health - Our Mission", 
    description: "Making medically guided weight loss simple, supportive, and accessible for every woman."
  }
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}