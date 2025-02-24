export const shakespeareWorks = [
  {
    id: 1,
    title: "Hamlet",
    type: "play",
    year: 1603,
    description: "The tragedy of the Prince of Denmark",
  },
  {
    id: 2,
    title: "Romeo and Juliet",
    type: "play",
    year: 1595,
    description: "A tragic tale of two star-crossed lovers",
  },
  {
    id: 3,
    title: "Sonnet 18",
    type: "sonnet",
    year: 1609,
    description: "Shall I compare thee to a summer's day?",
  }
];

export const passages = [
  {
    id: 1,
    workId: 1,
    title: "To be, or not to be",
    content: `To be, or not to be, that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take Arms against a Sea of troubles,
And by opposing end them...`,
    act: 3,
    scene: 1
  },
  {
    id: 2,
    workId: 2,
    title: "Romeo, Romeo",
    content: `O Romeo, Romeo, wherefore art thou Romeo?
Deny thy father and refuse thy name;
Or if thou wilt not, be but sworn my love
And I'll no longer be a Capulet.`,
    act: 2,
    scene: 2
  },
  {
    id: 3,
    workId: 3,
    title: "Sonnet 18",
    content: `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date...`,
    act: null,
    scene: null
  }
];