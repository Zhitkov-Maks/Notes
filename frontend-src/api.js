const PREFIX = "/api/notes";

const req = (url, options = {}) => {
  const { body } = options;

  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
          throw new Error(message);
        })
  );
};


export const getNotes = ({ age, search, page } = {}) => {
  return fetch(`/api/notes?age=${age}&search=${search}&page=${page}`)
    .then((res) =>
    res.ok
    ? res.json()
    : res.text().then((message) => {
        throw new Error(message);
      })
  );
};

export const createNote = (title, text) => {
  return fetch("/api/notes", {
    method: "POST",
    body: JSON.stringify({ title, text }),
    headers: {
      "Content-Type": "application/json",
    }
  }).then((res) =>
    res.ok
    ? res.json()
    : res.text().then((message) => {
        throw new Error(message);
      })
    );
};

export const getNote = (id) => {
  return fetch(`/api/notes/${id}`).then((res) =>
    res.ok
    ? res.json()
    : res.text().then((message) => {
        throw new Error(message);
      })
  );
};

export const archiveNote = (id) => {
  return fetch(`/api/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isArchived: true }),
    headers: {
      "Content-Type": "application/json",
    }
  })
};

export const unarchiveNote = (id) => {
    return fetch(`/api/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isArchived: false }),
    headers: {
      "Content-Type": "application/json",
    }
  })
};

export const editNote = (id, title, text) => {
  return fetch(`/api/notes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, text }),
    headers: {
      "Content-Type": "application/json",
    }
  }).then((res) =>
    res.ok
    ? res.json()
    : res.text().then((message) => {
        throw new Error(message);
      })
  );
};

export const deleteNote = (id) => {
  return fetch(`/api/notes/${id}`, {
    method: "DELETE"
  })
};

export const deleteAllArchived = () => {
  return fetch(`/api/notes`, {
    method: "DELETE"
  })
};

export const notePdfUrl = (id) => {
  return `${PREFIX}/${id}/download`;
}
