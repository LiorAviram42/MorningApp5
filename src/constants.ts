import { KidConfig, KidId, Task } from './types';

// Icons will be fetched from the new global folder
const getIcon = (name: string) => `/Icons_New/${name}`;

export const getKids = (theme: 'day' | 'night'): Record<KidId, KidConfig> => ({
  yuvali: {
    id: 'yuvali',
    name: 'יובלי',
    profileImg: '/day/Icons/profile_yuvali.png', // Always use day profile
    gradient: theme === 'night' ? 'linear-gradient(to right, #ea8b9c, #eab58b)' : 'linear-gradient(to right, #ffb3ba, #ffdfba)',
    outlineColor: theme === 'night' ? '#ea8b9c' : '#ffb3ba',
  },
  maayani: {
    id: 'maayani',
    name: 'מעייני',
    profileImg: '/day/Icons/profile_maayani.png', // Always use day profile
    gradient: theme === 'night' ? 'linear-gradient(to right, #8bbbe6, #9ee8c0)' : 'linear-gradient(to right, #bae1ff, #d0f4de)',
    outlineColor: theme === 'night' ? '#8bbbe6' : '#bae1ff',
  },
  pelegi: {
    id: 'pelegi',
    name: 'פלגי',
    profileImg: '/day/Icons/profile_pelegi.png', // Always use day profile
    gradient: theme === 'night' ? 'linear-gradient(to right, #9ee8c0, #e0e092)' : 'linear-gradient(to right, #d0f4de, #f2f2c2)',
    outlineColor: theme === 'night' ? '#9ee8c0' : '#d0f4de',
  },
});

export const getTasksForKid = (kidId: KidId, theme: 'day' | 'night'): Task[] => {
  let kidTasks: Omit<Task, 'side'>[] = [];

  if (theme === 'night') {
    kidTasks = [
      { id: 'teeth', title: 'צחצוח שיניים', iconOff: getIcon('Teeth.png'), iconOn: getIcon('Teeth.png') },
      { id: 'face', title: 'שטיפת פנים', iconOff: getIcon('Yuvali_Face.png'), iconOn: getIcon('Yuvali_Face.png') },
      { id: 'shower', title: 'מקלחת', iconOff: getIcon('Shower.png'), iconOn: getIcon('Shower.png') },
      { id: 'toilet', title: 'שירותים', iconOff: getIcon('Toilets.png'), iconOn: getIcon('Toilets.png') },
      { id: 'pj', title: 'פיג\'מה', iconOff: getIcon('PJ.png'), iconOn: getIcon('PJ.png') },
      { id: 'dinner', title: 'ארוחת ערב', iconOff: getIcon('Dinner.png'), iconOn: getIcon('Dinner.png') },
    ];
  } else {
    kidTasks = [
      { id: 'teeth', title: 'צחצוח שיניים', iconOff: getIcon('Teeth.png'), iconOn: getIcon('Teeth.png') },
      { id: 'face', title: 'שטיפת פנים', iconOff: getIcon('Yuvali_Face.png'), iconOn: getIcon('Yuvali_Face.png') },
      { id: 'toilet', title: 'שירותים', iconOff: getIcon('Toilets.png'), iconOn: getIcon('Toilets.png') },
      { id: 'sunscreen', title: 'קרם הגנה', iconOff: getIcon('Sunscreen.png'), iconOn: getIcon('Sunscreen.png') },
      { id: 'clothes', title: 'בגדים', iconOff: getIcon('Clothes.png'), iconOn: getIcon('Clothes.png') },
      { id: 'shoes', title: 'נעליים', iconOff: getIcon('Shoes.png'), iconOn: getIcon('Shoes.png') },
      { id: 'cereal', title: 'ארוחת בוקר', iconOff: getIcon('Breakfast.png'), iconOn: getIcon('Breakfast.png') },
    ];
  }

  // Specific Tasks
  if (kidId !== 'maayani') { // Yuvali, Pelegi
    kidTasks.push({ id: 'hair', title: 'סירוק', iconOff: getIcon('Hair.png'), iconOn: getIcon('Hair.png') });
  }
  if (kidId !== 'pelegi') { // Yuvali, Maayani
    kidTasks.push({ id: 'bag', title: theme === 'night' ? 'תיק למחר' : 'תיק', iconOff: getIcon('Bag.png'), iconOn: getIcon('Bag.png') });
  }

  // Assign sides: right column gets the extra item if count is odd.
  const rightColumnCount = Math.ceil(kidTasks.length / 2);
  let tasks: Task[] = kidTasks.map((t, index) => ({
    ...t,
    side: index < rightColumnCount ? 'right' : 'left'
  }));

  // Customize Face Icons
  const faceTask = tasks.find(t => t.id === 'face');
  if (faceTask) {
    if (kidId === 'yuvali') {
      faceTask.iconOff = getIcon('Yuvali_Face.png');
      faceTask.iconOn = getIcon('Yuvali_Face.png');
    } else if (kidId === 'maayani') {
      faceTask.iconOff = getIcon('Maayani_Face.png');
      faceTask.iconOn = getIcon('Maayani_Face.png');
    } else if (kidId === 'pelegi') {
      faceTask.iconOff = getIcon('Pelegi_Face.png');
      faceTask.iconOn = getIcon('Pelegi_Face.png');
    }
  }

  // Customize Toilet for Pelegi
  if (kidId === 'pelegi') {
    const toiletTask = tasks.find(t => t.id === 'toilet');
    if (toiletTask) {
      toiletTask.title = 'טיטול';
      toiletTask.iconOff = getIcon('Diaper_Off.png');
      toiletTask.iconOn = getIcon('Diaper_On.png');
    }
  }

  return tasks;
};
