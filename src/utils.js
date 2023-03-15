export const formatDate = (date) => {
    return date.getFullYear()+"/"+(parseInt(date.getMonth())+1)+"/"+date.getDate();
}