function removeBook(bookId) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/users/mybookshelf/books/remove');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function() {
    console.log('Remove request sent.');
  };
  xhr.send('bookId=' + bookId);
  $('#'+bookId).remove();
};
