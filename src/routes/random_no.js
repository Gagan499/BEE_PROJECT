export function generate_random_number(){
    let min_length = Math.pow(10,4-1);
    let max_length = Math.pow(10,4)-1;
    return Math.floor(Math.random() * (max_length - min_length + 1) + min_length);
}