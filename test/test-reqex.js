let str = "varchar2(5000)"
console.log(str.replace(/([\[(])(.+?)([\])])/g, (match, p1, p2, p3, offset, string) =>  p1 + "x" + p3));