# End-to-End Markdown Syntax Test

This document tests all kinds of complex Markdown grammar to ensure proper conversion to Telegraph.

## Headers

### Level 3 Header

#### Level 4 Header

##### Level 5 Header

###### Level 6 Header

## Text Formatting

**Bold text** and **alternative bold syntax**.

_Italic text_ and _alternative italic syntax_.

**_Bold and italic combined_** and **_alternative bold italic_**.

~~Strikethrough text~~ (if supported).

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item 1
  - Nested item 2
    - Deeply nested item
    - Another deeply nested item
- Third item

* Alternative bullet style
* Another item
  - Nested with asterisk

### Ordered Lists

1. First numbered item
2. Second numbered item
   1. Nested numbered item
   2. Another nested item
      1. Deeply nested
      2. More deeply nested
3. Third numbered item

### Mixed Lists

1. First item
   - Nested unordered item
   - Another nested unordered
2. Second item
   - Mix of ordered and unordered
     1. Ordered nested in unordered
     2. Second ordered

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## Links

[Simple link](https://github.com)

[Link with title](https://github.com "GitHub Homepage")

[Internal link to README](../README.md)

[Internal link to features](./features.md)

<https://auto-linked-url.com>

## Images

![Alt text for image](https://via.placeholder.com/150)

![Image with title](https://via.placeholder.com/300x200 "Placeholder Image")

## Code

### Inline Code

Use `inline code` within a sentence. Here's a variable: `const foo = "bar"`.

### Code Blocks

```javascript
// JavaScript code block
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

const result = greet("World");
```

```python
# Python code block
def calculate_sum(numbers):
    """Calculate the sum of a list of numbers."""
    total = sum(numbers)
    return total

result = calculate_sum([1, 2, 3, 4, 5])
print(f"Sum: {result}")
```

```typescript
// TypeScript with complex types
interface User {
  id: number;
  name: string;
  email?: string;
}

class UserService {
  private users: Map<number, User> = new Map();

  addUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUser(id: number): User | undefined {
    return this.users.get(id);
  }
}
```

```bash
# Bash script
#!/bin/bash
for file in *.md; do
  echo "Processing: $file"
  cat "$file" | wc -l
done
```

Plain code block without language:

```
This is a code block
without syntax highlighting
  with some indentation
```

## Blockquotes

> This is a simple blockquote.

> This is a multi-line blockquote.
> It spans multiple lines.
> All prefixed with `>`.

> ### Blockquote with header
>
> You can include **formatted text** and `code` in blockquotes.
>
> - Even lists
> - Can be included

> Nested blockquotes:
>
> > This is nested
> >
> > > And this is double nested
> > > with multiple lines

## Tables

### Simple Table

| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Row 1    | Data     | Value    |
| Row 2    | Info     | Number   |
| Row 3    | Text     | Result   |

### Aligned Tables

| Left Aligned | Center Aligned | Right Aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |
| Text         |      Text      |          Text |
| 1            |       2        |             3 |

### Table with Formatting

| Feature                     | Status         | Notes    |
| --------------------------- | -------------- | -------- |
| **Bold**                    | _Italic_       | `Code`   |
| [Link](https://example.com) | ~~Strike~~     | Normal   |
| Complex                     | **_Combined_** | Multiple |

### Wide Table

| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| A     | B     | C     | D     | E     | F     | G     | H     |
| 1     | 2     | 3     | 4     | 5     | 6     | 7     | 8     |
| α     | β     | γ     | δ     | ε     | ζ     | η     | θ     |

## Horizontal Rules

---

---

---

## Complex Nested Structures

1. **Ordered list with complex content**

   This is a paragraph within a list item.

   ```javascript
   // Code block in list
   const nested = true;
   ```

   - Nested unordered list
   - Another nested item
     > With a blockquote
     > spanning multiple lines

2. **Second item with table**

   | Column A | Column B |
   | -------- | -------- |
   | Data 1   | Value 1  |
   | Data 2   | Value 2  |

## Special Characters and Entities

Ampersand: &

Less than: <

Greater than: >

Copyright: ©

Trademark: ™

Registered: ®

Arrows: → ← ↑ ↓

Math symbols: ± × ÷ ≈ ≠ ≤ ≥

Greek letters: α β γ δ ε ζ η θ λ μ π σ ω

Emojis: 🚀 📝 🔗 ✅ ❌ 💡 🎯 ⚡

## Escape Characters

\*Not italic\*

\*\*Not bold\*\*

\[Not a link\](url)

\`Not code\`

## Long Content Test

### Lorem Ipsum Paragraphs

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

### Long Code Block

```python
# Complex Python example with various features
import asyncio
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
from enum import Enum

class Status(Enum):
    """Status enumeration for tasks."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class Task:
    """Represents a task in the system."""
    id: int
    title: str
    description: str
    status: Status
    priority: int = 0
    tags: List[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []

    def is_complete(self) -> bool:
        """Check if task is completed."""
        return self.status == Status.COMPLETED

    async def execute(self) -> bool:
        """Execute the task asynchronously."""
        try:
            self.status = Status.IN_PROGRESS
            await asyncio.sleep(1)  # Simulate work
            self.status = Status.COMPLETED
            return True
        except Exception as e:
            self.status = Status.FAILED
            print(f"Task failed: {e}")
            return False

class TaskManager:
    """Manages a collection of tasks."""

    def __init__(self):
        self.tasks: Dict[int, Task] = {}
        self._next_id = 1

    def add_task(self, title: str, description: str,
                 priority: int = 0, tags: Optional[List[str]] = None) -> Task:
        """Add a new task to the manager."""
        task = Task(
            id=self._next_id,
            title=title,
            description=description,
            status=Status.PENDING,
            priority=priority,
            tags=tags or []
        )
        self.tasks[self._next_id] = task
        self._next_id += 1
        return task

    async def execute_all(self) -> Dict[str, int]:
        """Execute all pending tasks concurrently."""
        pending_tasks = [
            task for task in self.tasks.values()
            if task.status == Status.PENDING
        ]

        results = await asyncio.gather(
            *[task.execute() for task in pending_tasks],
            return_exceptions=True
        )

        stats = {
            "total": len(pending_tasks),
            "successful": sum(1 for r in results if r is True),
            "failed": sum(1 for r in results if r is False or isinstance(r, Exception))
        }

        return stats

    def get_tasks_by_status(self, status: Status) -> List[Task]:
        """Get all tasks with the specified status."""
        return [
            task for task in self.tasks.values()
            if task.status == status
        ]

    def get_high_priority_tasks(self, threshold: int = 5) -> List[Task]:
        """Get tasks with priority above threshold."""
        return sorted(
            [task for task in self.tasks.values() if task.priority >= threshold],
            key=lambda t: t.priority,
            reverse=True
        )

async def main():
    """Main execution function."""
    manager = TaskManager()

    # Add some tasks
    manager.add_task("Implement feature X", "Add new authentication", priority=8, tags=["auth", "feature"])
    manager.add_task("Fix bug #123", "Resolve login issue", priority=10, tags=["bug", "critical"])
    manager.add_task("Update docs", "Add API documentation", priority=3, tags=["docs"])
    manager.add_task("Refactor code", "Clean up legacy code", priority=5, tags=["refactor"])

    # Execute all tasks
    print("Executing all tasks...")
    stats = await manager.execute_all()
    print(f"Execution complete: {stats}")

    # Display results
    completed = manager.get_tasks_by_status(Status.COMPLETED)
    print(f"\nCompleted {len(completed)} tasks:")
    for task in completed:
        print(f"  - {task.title} (Priority: {task.priority})")

    # Show high priority tasks
    high_priority = manager.get_high_priority_tasks(threshold=7)
    print(f"\nHigh priority tasks: {len(high_priority)}")
    for task in high_priority:
        print(f"  - {task.title}: {task.status.value}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Inline HTML (if supported)

<div style="color: red;">
This is HTML content that might not be supported in Telegraph.
</div>

<strong>HTML bold</strong> and <em>HTML italic</em>

## Footnotes (if supported)

Here's a sentence with a footnote[^1].

Another sentence with another footnote[^2].

[^1]: This is the first footnote.

[^2]: This is the second footnote with more detail.

## Definition Lists (if supported)

Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Another definition for term 2

## Abbreviations (if supported)

The HTML specification is maintained by the W3C.

_[HTML]: Hyper Text Markup Language
_[W3C]: World Wide Web Consortium

## Math (if supported)

Inline math: $E = mc^2$

Block math:

$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$

## URLs and Email

Contact us at <email@example.com>

Visit our website: <https://example.com>

## Complex Link References

[Reference link][ref1]

[Another reference][ref2]

[Case-insensitive reference][REF1]

([Link in parentheses](https://example.com))

[ref1]: https://example.com/page1 "Optional Title"
[ref2]: https://example.com/page2

## Combining Everything

Here's a paragraph with **bold**, _italic_, **_bold italic_**, `inline code`, [a link](https://example.com), and an image: ![img](https://via.placeholder.com/50x50)

> And a blockquote with **bold text**, `code`, and a [link](https://github.com).
>
> ```javascript
> // Code in blockquote
> const test = true;
> ```

---

## Conclusion

This document tests a comprehensive set of Markdown features. Some features may not be fully supported by Telegraph, but this provides a good test of the conversion capabilities.

**Key Test Areas:**

- ✅ Headers (all levels)
- ✅ Text formatting (bold, italic, combined)
- ✅ Lists (ordered, unordered, nested, task lists)
- ✅ Links (external, internal, auto-linked)
- ✅ Images
- ✅ Code (inline and blocks with various languages)
- ✅ Blockquotes (simple and nested)
- ✅ Tables (simple, aligned, with formatting)
- ✅ Horizontal rules
- ✅ Special characters and emojis
- ✅ Complex nested structures
- ⚠️ HTML (limited support expected)
- ⚠️ Footnotes (may not be supported)
- ⚠️ Math (may not be supported)

Back to [main documentation](../README.md) | See also: [Features](./features.md) | [Usage Guide](./usage-guide.md)
