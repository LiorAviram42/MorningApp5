import { KidConfig, KidId, Task } from './types';

// Icons will be fetched from the respective theme folder
const getIcon = (name: string, theme: 'day' | 'night') => `/${theme}/Icons/${name}`;

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
      { id: 'teeth', title: 'צחצוח\nשיניים', iconOff: getIcon('icon_teeth_off.png', theme), iconOn: getIcon('icon_teeth_on.png', theme) },
      { id: 'face', title: 'שטיפת פנים', iconOff: getIcon('icon_face_yuvali_off.png', theme), iconOn: getIcon('icon_face_yuvali_on.png', theme) },
      { id: 'shower', title: 'מקלחת', iconOff: getIcon('icon_shower_off.png', theme), iconOn: getIcon('icon_shower_on.png', theme) },
      { id: 'toilet', title: 'שירותים', iconOff: getIcon('icon_toilet_off.png', theme), iconOn: getIcon('icon_toilet_on.png', theme) },
      { id: 'pj', title: 'פיג\'מה', iconOff: getIcon('icon_PJ_Off.png', theme), iconOn: getIcon('icon_PJ_On.png', theme) },
      { id: 'dinner', title: 'ארוחת ערב', iconOff: getIcon('Dinner_Off.png', theme), iconOn: getIcon('Dinner_On.png', theme) },
    ];
  } else {
    kidTasks = [
      { id: 'teeth', title: 'צחצוח\nשיניים', iconOff: getIcon('icon_teeth_off.png', theme), iconOn: getIcon('icon_teeth_on.png', theme) },
      { id: 'face', title: 'שטיפת פנים', iconOff: getIcon('icon_face_yuvali_off.png', theme), iconOn: getIcon('icon_face_yuvali_on.png', theme) },
      { id: 'toilet', title: 'שירותים', iconOff: getIcon('icon_toilet_off.png', theme), iconOn: getIcon('icon_toilet_on.png', theme) },
      { id: 'sunscreen', title: 'קרם הגנה', iconOff: getIcon('icon_sunscreen_off.png', theme), iconOn: getIcon('icon_sunscreen_on.png', theme) },
      { id: 'clothes', title: 'בגדים', iconOff: getIcon('icon_clothes_off.png', theme), iconOn: getIcon('icon_clothes_on.png', theme) },
      { id: 'shoes', title: 'נעליים', iconOff: getIcon('icon_shoes_off.png', theme), iconOn: getIcon('icon_shoes_on.png', theme) },
      { id: 'cereal', title: 'ארוחת בוקר', iconOff: getIcon('icon_cereal_off.png', theme), iconOn: getIcon('icon_cereal_on.png', theme) },
    ];
  }

  // Specific Tasks
  if (kidId !== 'maayani') { // Yuvali, Pelegi
    kidTasks.push({ id: 'hair', title: 'סירוק', iconOff: getIcon('icon_hair_off.png', theme), iconOn: getIcon('icon_hair_on.png', theme) });
  }
  if (kidId !== 'pelegi') { // Yuvali, Maayani
    kidTasks.push({ id: 'bag', title: theme === 'night' ? 'תיק למחר' : 'תיק', iconOff: getIcon('icon_bag_off.png', theme), iconOn: getIcon('icon_bag_on.png', theme) });
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
      faceTask.iconOff = getIcon('icon_face_yuvali_off.png', theme);
      faceTask.iconOn = getIcon('icon_face_yuvali_on.png', theme);
    } else if (kidId === 'maayani') {
      faceTask.iconOff = getIcon('icon_face_maayani_off.png', theme);
      faceTask.iconOn = getIcon('icon_face_maayani_on.png', theme);
    } else if (kidId === 'pelegi') {
      faceTask.iconOff = getIcon('icon_face_pelegi_off.png', theme);
      faceTask.iconOn = getIcon('icon_face_pelegi_on.png', theme);
    }
  }

  // Customize Toilet for Pelegi
  if (kidId === 'pelegi') {
    const toiletTask = tasks.find(t => t.id === 'toilet');
    if (toiletTask) {
      toiletTask.title = 'טיטול';
      toiletTask.iconOff = getIcon('icon_diaper_off.png', theme);
      toiletTask.iconOn = getIcon('icon_diaper_on.png', theme);
    }
  }

  return tasks;
};
