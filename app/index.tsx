import { Redirect } from 'expo-router';

import { useContent } from '@/src/content/ContentProvider';

export default function IndexScreen() {
  const { selectedLanguage } = useContent();
  return <Redirect href={selectedLanguage ? '/home' : '/language'} />;
}

