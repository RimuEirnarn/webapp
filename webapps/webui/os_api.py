"""OS API"""

class OSAPI:
    """OS API"""

    def readfile(self, filename: str) -> str:
        """Read file"""
        with open(filename, encoding='utf-8') as file:
            return file.read()

    def writefile(self, filename: str, content: str) -> int:
        '''Write to file'''
        with open(filename, 'w', encoding='utf-8') as file:
            return file.write(content)
