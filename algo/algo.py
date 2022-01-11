def solve(word_list, target):
  word_list_set = set(word_list)
  
  for i in range(1, len(target)):
    head = target[:i]
    tail = target[i:]
    if head != tail and head in word_list_set and tail in word_list_set:
      return (head, tail)
  return None
  
print(solve(['ab', 'bc', 'cd'], 'abcd')) # ('ab', 'cd')
print(solve(['ab', 'bc', 'cd'], 'cdab')) # ('cd', 'ab')
print(solve(['ab', 'bc', 'cd'], 'abab')) # None