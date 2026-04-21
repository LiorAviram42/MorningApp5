import { KidConfig, KidId, Task } from './types';

const profileYuvali = '/Icons/profile_yuvali.png';
const profileMaayani = '/Icons/profile_maayani.png';
const profilePelegi = '/Icons/profile_pelegi.png';

const teethOff = '/Icons/icon_teeth_off.png';
const teethOn = '/Icons/icon_teeth_on.png';
const hairOff = '/Icons/icon_hair_off.png';
const hairOn = '/Icons/icon_hair_on.png';
const toiletOff = '/Icons/icon_toilet_off.png';
const toiletOn = '/Icons/icon_toilet_on.png';
const clothesOff = '/Icons/icon_clothes_off.png';
const clothesOn = '/Icons/icon_clothes_on.png';
const shoesOff = '/Icons/icon_shoes_off.png';
const shoesOn = '/Icons/icon_shoes_on.png';
const cerealOff = '/Icons/icon_cereal_off.png';
const cerealOn = '/Icons/icon_cereal_on.png';
const bagOff = '/Icons/icon_bag_off.png';
const bagOn = '/Icons/icon_bag_on.png';

const faceYuvaliOff = '/Icons/icon_face_yuvali_off.png';
const faceYuvaliOn = '/Icons/icon_face_yuvali_on.png';
const faceMaayaniOff = '/Icons/icon_face_maayani_off.png';
const faceMaayaniOn = '/Icons/icon_face_maayani_on.png';
const facePelegiOff = '/Icons/icon_face_pelegi_off.png';
const facePelegiOn = '/Icons/icon_face_pelegi_on.png';

const diaperOff = '/Icons/icon_diaper_off.png';
const diaperOn = '/Icons/icon_diaper_on.png';

export const KIDS: Record<KidId, KidConfig> = {
  yuvali: {
    id: 'yuvali',
    name: 'יובלי',
    profileImg: profileYuvali,
    gradient: 'linear-gradient(to right, #ffb3ba, #ffdfba)',
    outlineColor: '#ffb3ba',
  },
  maayani: {
    id: 'maayani',
    name: 'מעייני',
    profileImg: profileMaayani,
    gradient: 'linear-gradient(to right, #bae1ff, #d0f4de)',
    outlineColor: '#bae1ff',
  },
  pelegi: {
    id: 'pelegi',
    name: 'פלגי',
    profileImg: profilePelegi,
    gradient: 'linear-gradient(to right, #d0f4de, #f2f2c2)',
    outlineColor: '#d0f4de',
  },
};

export const getTasksForKid = (kidId: KidId): Task[] => {
  const baseTasks: Task[] = [
    { id: 'teeth', title: 'צחצוח\nשיניים', iconOff: teethOff, iconOn: teethOn, side: 'right' },
    { id: 'hair', title: 'סירוק', iconOff: hairOff, iconOn: hairOn, side: 'right' },
    { id: 'toilet', title: 'שירותים', iconOff: toiletOff, iconOn: toiletOn, side: 'right' },
    { id: 'face', title: 'שטיפת פנים', iconOff: faceYuvaliOff, iconOn: faceYuvaliOn, side: 'right' },
    { id: 'clothes', title: 'בגדים', iconOff: clothesOff, iconOn: clothesOn, side: 'left' },
    { id: 'shoes', title: 'נעליים', iconOff: shoesOff, iconOn: shoesOn, side: 'left' },
    { id: 'cereal', title: 'ארוחת בוקר', iconOff: cerealOff, iconOn: cerealOn, side: 'left' },
    { id: 'bag', title: 'תיק', iconOff: bagOff, iconOn: bagOn, side: 'left' }
  ];

  let tasks = [...baseTasks];

  const faceTask = tasks.find(t => t.id === 'face');
  if (faceTask) {
    if (kidId === 'yuvali') {
      faceTask.iconOff = faceYuvaliOff;
      faceTask.iconOn = faceYuvaliOn;
    } else if (kidId === 'maayani') {
      faceTask.iconOff = faceMaayaniOff;
      faceTask.iconOn = faceMaayaniOn;
    } else if (kidId === 'pelegi') {
      faceTask.iconOff = facePelegiOff;
      faceTask.iconOn = facePelegiOn;
    }
  }

  if (kidId === 'maayani') {
    tasks = tasks.filter(t => t.id !== 'hair');
    const clothesTask = tasks.find(t => t.id === 'clothes');
    if (clothesTask) clothesTask.side = 'right';
  } else if (kidId === 'pelegi') {
    tasks = tasks.filter(t => t.id !== 'bag');
    const toiletTask = tasks.find(t => t.id === 'toilet');
    if (toiletTask) {
      toiletTask.title = 'טיטול';
      toiletTask.iconOff = diaperOff;
      toiletTask.iconOn = diaperOn;
    }
  }

  return tasks;
};
