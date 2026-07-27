export type Dictionary = {
  meta: {
    description: string;
  };
  home: {
    eyebrow: string;
    lede: string;
  };
  boardForm: {
    title: string;
    titlePlaceholder: string;
    titleDefault: string;
    yourName: string;
    namePlaceholder: string;
    creating: string;
    create: string;
  };
  board: {
    youAre: string;
    invite: string;
    inviting: string;
    copied: string;
    replies: string;
  };
  columns: {
    new: string;
    in_progress: string;
    answered: string;
    done: string;
  };
  cardTypes: {
    question: string;
    task: string;
  };
  quickAdd: {
    trigger: string;
    title: string;
    titlePlaceholder: string;
    type: string;
    description: string;
    descriptionPlaceholder: string;
    saving: string;
    save: string;
    cancel: string;
  };
  invitePage: {
    eyebrow: string;
    usedTitle: string;
    usedBody: string;
    joinLede: string;
    nameLabel: string;
    namePlaceholder: string;
    joining: string;
    join: string;
  };
  cardPage: {
    back: string;
    close: string;
    noDescription: string;
    stage: string;
    discussion: string;
    emptyThread: string;
  };
  comment: {
    placeholder: string;
    sending: string;
    send: string;
  };
  notFound: {
    title: string;
    body: string;
    home: string;
  };
  common: {
    stageAria: string;
  };
  errors: {
    validation: string;
    createOrganizer: string;
    createBoard: string;
    invalidBoard: string;
    unauthorized: string;
    createInvite: string;
    inviteNotFound: string;
    inviteUsed: string;
    createCard: string;
    cardNotFound: string;
    moveCard: string;
    addComment: string;
    joinFailed: string;
    titleShort: string;
    titleLong: string;
    nameRequired: string;
    nameLong: string;
    cardTitleShort: string;
    commentEmpty: string;
  };
};

export const en: Dictionary = {
  meta: {
    description: "Public Kanban board via invite — no registration",
  },
  home: {
    eyebrow: "No registration",
    lede: "One shared board for questions and tasks. Create a board, tap Invite — the link is copied, send it to a teammate.",
  },
  boardForm: {
    title: "Board name",
    titlePlaceholder: "e.g. Sprint Q3",
    titleDefault: "Project discussions",
    yourName: "Your name",
    namePlaceholder: "How others see you on the board",
    creating: "Creating…",
    create: "Create board",
  },
  board: {
    youAre: "Signed in as",
    invite: "Invite",
    inviting: "…",
    copied: "Copied",
    replies: "{n} replies",
  },
  columns: {
    new: "New",
    in_progress: "In progress",
    answered: "Answered",
    done: "Done",
  },
  cardTypes: {
    question: "Question",
    task: "Task",
  },
  quickAdd: {
    trigger: "+ Quick item",
    title: "Title",
    titlePlaceholder: "Short question or task",
    type: "Type",
    description: "Description",
    descriptionPlaceholder: "Optional",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
  },
  invitePage: {
    eyebrow: "Invite",
    usedTitle: "Link already used",
    usedBody: "This personal invite is one-time. Ask the board owner for a new link to “{board}”.",
    joinLede: "Enter your name — you’re on the board. No registration needed.",
    nameLabel: "Your name on the board",
    namePlaceholder: "How should we call you",
    joining: "Joining…",
    join: "Join board",
  },
  cardPage: {
    back: "← Back to board",
    close: "Close",
    noDescription: "No description yet.",
    stage: "Stage",
    discussion: "Discussion",
    emptyThread: "No replies yet. Write the first one.",
  },
  comment: {
    placeholder: "Write a reply or comment…",
    sending: "Sending…",
    send: "Send",
  },
  notFound: {
    title: "Page not found",
    body: "The link is outdated, or the board / invite does not exist.",
    home: "Home",
  },
  common: {
    stageAria: "Card stage",
  },
  errors: {
    validation: "Validation error",
    createOrganizer: "Could not create organizer",
    createBoard: "Could not create board",
    invalidBoard: "Invalid board",
    unauthorized: "No access to this board",
    createInvite: "Could not create invite",
    inviteNotFound: "Invite not found",
    inviteUsed: "This invite has already been used",
    createCard: "Could not create card",
    cardNotFound: "Card not found",
    moveCard: "Could not move card",
    addComment: "Could not add comment",
    joinFailed: "Could not join",
    titleShort: "Name is too short",
    titleLong: "Name is too long",
    nameRequired: "Enter your name",
    nameLong: "Name is too long",
    cardTitleShort: "Title is too short",
    commentEmpty: "Comment is empty",
  },
};
