import { KidConfig, KidId, Task } from './types';

// Icons will be fetched from the new global folder
const getIcon = (name: string) => `/Icons_Vector/${name}`;

export const getKids = (theme: 'day' | 'night', lang: 'he' | 'en' = 'he'): Record<KidId, KidConfig> => ({
  yuvali: {
    id: 'yuvali',
    name: lang === 'en' ? 'Yuvali' : 'יובלי',
    profileImg: '/Profile Pictures/profile_yuvali.png',
    gradient: theme === 'night' 
      ? `linear-gradient(to left, #ea8b9c, #eab58b)` 
      : `linear-gradient(to left, #ffb3ba, #ffdfba)`,
    colorA: theme === 'night' ? '#ea8b9c' : '#ffb3ba',
    colorB: theme === 'night' ? '#eab58b' : '#ffdfba',
    outlineColor: theme === 'night' ? '#ea8b9c' : '#ffb3ba',
  },
  maayani: {
    id: 'maayani',
    name: lang === 'en' ? 'Maayani' : 'מעייני',
    profileImg: '/Profile Pictures/profile_maayani.png',
    gradient: theme === 'night' 
      ? `linear-gradient(to left, #8bbbe6, #9ee8c0)` 
      : `linear-gradient(to left, #bae1ff, #d0f4de)`,
    colorA: theme === 'night' ? '#8bbbe6' : '#bae1ff',
    colorB: theme === 'night' ? '#9ee8c0' : '#d0f4de',
    outlineColor: theme === 'night' ? '#8bbbe6' : '#bae1ff',
  },
  pelegi: {
    id: 'pelegi',
    name: lang === 'en' ? 'Pelegi' : 'פלגי',
    profileImg: '/Profile Pictures/profile_pelegi.png',
    gradient: theme === 'night' 
      ? `linear-gradient(to left, #aecbb2, #e6d7a4)` 
      : `linear-gradient(to left, #dcedd9, #fdf4ce)`,
    colorA: theme === 'night' ? '#aecbb2' : '#dcedd9',
    colorB: theme === 'night' ? '#e6d7a4' : '#fdf4ce',
    outlineColor: theme === 'night' ? '#aecbb2' : '#dcedd9',
  },
});

export const getTasksForKid = (kidId: KidId, theme: 'day' | 'night', lang: 'he' | 'en' = 'he'): Task[] => {
  let kidTasks: Omit<Task, 'side'>[] = [];

  if (theme === 'night') {
    kidTasks = [
      { id: 'teeth', title: lang === 'en' ? 'Brush Teeth' : 'צחצוח שיניים', iconOff: getIcon('Teeth.svg'), iconOn: getIcon('Teeth.svg') },
      { id: 'face', title: lang === 'en' ? 'Wash Face' : 'שטיפת פנים', iconOff: getIcon('Face.svg'), iconOn: getIcon('Face.svg') },
      { id: 'shower', title: lang === 'en' ? 'Shower' : 'מקלחת', iconOff: getIcon('Shower.svg'), iconOn: getIcon('Shower.svg') },
      { id: 'toilet', title: lang === 'en' ? 'Toilet' : 'שירותים', iconOff: getIcon('Toilet.svg'), iconOn: getIcon('Toilet.svg') },
      { id: 'pj', title: lang === 'en' ? 'Pajamas' : 'פיג\'מה', iconOff: getIcon('PJ.svg'), iconOn: getIcon('PJ.svg') },
      { id: 'dinner', title: lang === 'en' ? 'Dinner' : 'ארוחת ערב', iconOff: getIcon('Dinner.svg'), iconOn: getIcon('Dinner.svg') },
    ];
  } else {
    kidTasks = [
      { id: 'teeth', title: lang === 'en' ? 'Brush Teeth' : 'צחצוח שיניים', iconOff: getIcon('Teeth.svg'), iconOn: getIcon('Teeth.svg') },
      { id: 'face', title: lang === 'en' ? 'Wash Face' : 'שטיפת פנים', iconOff: getIcon('Face.svg'), iconOn: getIcon('Face.svg') },
      { id: 'toilet', title: lang === 'en' ? 'Toilet' : 'שירותים', iconOff: getIcon('Toilet.svg'), iconOn: getIcon('Toilet.svg') },
      { id: 'sunscreen', title: lang === 'en' ? 'Sunscreen' : 'קרם הגנה', iconOff: getIcon('Sunscreen.svg'), iconOn: getIcon('Sunscreen.svg') },
      { id: 'clothes', title: lang === 'en' ? 'Clothes' : 'בגדים', iconOff: getIcon('Clothes.svg'), iconOn: getIcon('Clothes.svg') },
      { id: 'shoes', title: lang === 'en' ? 'Shoes' : 'נעליים', iconOff: getIcon('Shoes.svg'), iconOn: getIcon('Shoes.svg') },
      { id: 'cereal', title: lang === 'en' ? 'Breakfast' : 'ארוחת בוקר', iconOff: getIcon('Breakfast.svg'), iconOn: getIcon('Breakfast.svg') },
    ];
  }

  // Specific Tasks
  if (kidId !== 'maayani') { // Yuvali, Pelegi
    kidTasks.push({ id: 'hair', title: lang === 'en' ? 'Brush Hair' : 'סירוק', iconOff: getIcon('Hair.svg'), iconOn: getIcon('Hair.svg') });
  }
  if (kidId !== 'pelegi') { // Yuvali, Maayani
    kidTasks.push({ id: 'bag', title: lang === 'en' ? (theme === 'night' ? 'Bag for Tomorrow' : 'Bag') : (theme === 'night' ? 'תיק למחר' : 'תיק'), iconOff: getIcon('Bag.svg'), iconOn: getIcon('Bag.svg') });
  }

  // Assign sides: right column gets the extra item if count is odd.
  const rightColumnCount = Math.ceil(kidTasks.length / 2);
  let tasks: Task[] = kidTasks.map((t, index) => ({
    ...t,
    side: index < rightColumnCount ? 'right' : 'left'
  }));

  // Customize Toilet for Pelegi
  if (kidId === 'pelegi') {
    const toiletTask = tasks.find(t => t.id === 'toilet');
    if (toiletTask) {
      toiletTask.title = lang === 'en' ? 'Diaper' : 'טיטול';
      toiletTask.iconOff = getIcon('Diaper Off.svg');
      toiletTask.iconOn = getIcon('Diaper On.svg');
    }
  }

  return tasks;
};
