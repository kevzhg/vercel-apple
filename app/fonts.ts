import localFont from 'next/font/local';

export const proximaNovaRegular = localFont({
  src: '../public/fonts/Proxima Nova Regular.ttf',
  variable: '--font-proxima-regular',
  weight: '400',
  display: 'swap',
});

export const proximaNovaSemibold = localFont({
  src: '../public/fonts/Proxima Nova Semibold.ttf',
  variable: '--font-proxima-semibold',
  weight: '600',
  display: 'swap',
});

export const proximaNovaExtrabold = localFont({
  src: '../public/fonts/Proxima Nova Extrabold.ttf',
  variable: '--font-proxima-extrabold',
  weight: '800',
  display: 'swap',
});
