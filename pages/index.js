import Head from 'next/head';
import TTSAudioSync from '../components/TTSAudioSync';

export default function Home() {
  return (
    <>
      <Head>
        <title>TTS Audio Sync</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>
      
      <TTSAudioSync />
    </>
  );
} 