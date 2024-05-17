import { Component, OnInit, ViewChild, ElementRef, Renderer2, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface Item {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'text' | 'image';
  content: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChild('gridContainer', { static: false }) gridContainer!: ElementRef;

  title = 'Baskı Editörü';
  public Editor = ClassicEditor;
  public editorConfig = {
    toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
    language: 'en'
  };

  form = new FormGroup({
    paperType: new FormControl('A4', Validators.required),
    customWidth: new FormControl({ value: '', disabled: true }, Validators.required),
    customHeight: new FormControl({ value: '', disabled: true }, Validators.required),
    contentType: new FormControl('text', Validators.required),
    fileName: new FormControl(''),
    textContent: new FormControl('', Validators.required),
    fieldName: new FormControl('')
  });

  items: Item[] = [];
  private currentDragItem: Item | null = null;
  private selectedItem: Item | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isResizing = false;

  currentX: number | null = null;
  currentY: number | null = null;

  containerWidth: number = 801;
  containerHeight: number = 801;

  constructor(private http: HttpClient, private renderer: Renderer2, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.form.get('paperType')?.valueChanges.subscribe(value => {
      if (value === 'special') {
        this.form.get('customWidth')?.enable();
        this.form.get('customHeight')?.enable();
      } else {
        this.form.get('customWidth')?.disable();
        this.form.get('customHeight')?.disable();
        this.updateContainerDimensions(value || '');
      }
    });

    this.form.get('customWidth')?.valueChanges.subscribe(() => {
      if (this.form.get('paperType')?.value === 'special') {
        this.updateContainerDimensions('special');
      }
    });

    this.form.get('customHeight')?.valueChanges.subscribe(() => {
      if (this.form.get('paperType')?.value === 'special') {
        this.updateContainerDimensions('special');
      }
    });

    this.form.get('contentType')?.valueChanges.subscribe(value => {
      const textContentControl = this.form.get('textContent');
      const fieldNameControl = this.form.get('fieldName');
      const fileNameControl = this.form.get('fileName');
      if (value === 'text') {
        textContentControl?.enable();
        fieldNameControl?.enable();
        fileNameControl?.clearValidators();
      } else if (value === 'image') {
        textContentControl?.disable();
        fieldNameControl?.disable();
        fileNameControl?.setValidators(Validators.required);
      }
      fileNameControl?.updateValueAndValidity();
    });
  }

  updateContainerDimensions(paperType: string) {
    if (paperType === 'A3') {
      this.containerWidth = 841;
      this.containerHeight = 1189;
    } else if (paperType === 'A4') {
      this.containerWidth = 595;
      this.containerHeight = 842;
    } else if (paperType === 'A5') {
      this.containerWidth = 420;
      this.containerHeight = 595;
    } else if (paperType === 'special') {
      this.containerWidth = parseFloat(this.form.get('customWidth')?.value || '0');
      this.containerHeight = parseFloat(this.form.get('customHeight')?.value || '0');
    }
  }

  startDrag(event: MouseEvent, item: Item) {
    this.selectedItem = item;
    if (event.shiftKey) {
      this.isResizing = true;
      this.currentDragItem = item;
      window.addEventListener('mousemove', this.onResize);
      window.addEventListener('mouseup', this.stopResize);
    } else {
      this.currentDragItem = item;
      this.dragStartX = event.clientX - item.x;
      this.dragStartY = event.clientY - item.y;
      window.addEventListener('mousemove', this.onDrag);
      window.addEventListener('mouseup', this.stopDrag);
    }
  }

  onDrag = (event: MouseEvent) => {
    if (this.currentDragItem) {
      this.currentDragItem.x = event.clientX - this.dragStartX;
      this.currentDragItem.y = event.clientY - this.dragStartY;

      this.constrainItemToBounds(this.currentDragItem);

      this.currentX = this.currentDragItem.x;
      this.currentY = this.currentDragItem.y;
    }
  };

  stopDrag = () => {
    window.removeEventListener('mousemove', this.onDrag);
    window.removeEventListener('mouseup', this.stopDrag);
    this.currentDragItem = null;
  };

  onResize = (event: MouseEvent) => {
    if (this.currentDragItem && this.isResizing) {
      const deltaX = event.clientX - (this.currentDragItem.x + this.currentDragItem.width);
      const deltaY = event.clientY - (this.currentDragItem.y + this.currentDragItem.height);
      const newWidth = this.currentDragItem.width + deltaX;
      const newHeight = this.currentDragItem.height + deltaY;

      if (newWidth > 0 && newHeight > 0) {
        this.currentDragItem.width = newWidth;
        this.currentDragItem.height = newHeight;
      }
    }
  };

  stopResize = () => {
    window.removeEventListener('mousemove', this.onResize);
    window.removeEventListener('mouseup', this.stopResize);
    this.currentDragItem = null;
    this.isResizing = false;
  };

  enableEditing(item: Item) {
    if (item.type === 'text') {
      const editableElement = document.getElementById(`item-${item.id}`);
      if (editableElement) {
        editableElement.contentEditable = 'true';
        editableElement.focus();
      }
    }
  }

  saveEditedContent(item: Item) {
    const editableElement = document.getElementById(`item-${item.id}`);
    if (editableElement) {
      item.content = editableElement.innerHTML;
      editableElement.contentEditable = 'false';
    }
  }

  sanitizeContent(content: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  constrainItemToBounds(item: Item) {
    if (item.x < 0) item.x = 0;
    if (item.y < 0) item.y = 0;
    if (item.x + item.width > this.containerWidth) item.x = this.containerWidth - item.width;
    if (item.y + item.height > this.containerHeight) item.y = this.containerHeight - item.height;
  }

  submit() {
    const formData = new FormData();
    formData.append('paperType', this.form.value.paperType ?? '');
    let width: string;
    let height: string;

    switch (this.form.value.paperType) {
      case 'A3':
        width = '297';
        height = '420';
        break;
      case 'A4':
        width = '210';
        height = '297';
        break;
      case 'A5':
        width = '148';
        height = '210';
        break;
      case 'special':
        width = this.form.get('customWidth')?.value || '0';
        height = this.form.get('customHeight')?.value || '0';
        break;
      default:
        width = '0';
        height = '0';
    }

    formData.append('customWidth', width);
    formData.append('customHeight', height);

    formData.append('contentType', this.form.value.contentType ?? '');
    formData.append('fieldName', this.form.value.fieldName ?? '');

    const contentType = this.form.value.contentType;
    const gridRect = this.gridContainer.nativeElement.getBoundingClientRect();
    const centerX = (gridRect.width / 2).toFixed(2);
    const centerY = (gridRect.height / 2).toFixed(2);

    if (contentType === 'image') {
      const fileInput: any = document.querySelector('#fileName');
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const newItem: Item = {
            id: Date.now(),
            x: parseFloat(centerX),
            y: parseFloat(centerY),
            width: 100,
            height: 100,
            type: 'image',
            content: reader.result as string
          };
          this.items.push(newItem);
        };
        reader.readAsDataURL(file);
      } else {
        console.error('No file selected');
        return;
      }
    } else {
      const textContent = this.form.get('textContent')?.value ?? '';
      const fieldName = this.form.get('fieldName')?.value ?? '';
      const combinedContent = `${fieldName}: ${textContent}`;
      const newItem: Item = {
        id: Date.now(),
        x: parseFloat(centerX),
        y: parseFloat(centerY),
        width: 200,
        height: 50,
        type: 'text',
        content: combinedContent
      };
      this.items.push(newItem);
    }

    this.http.post('https://pusulaweb.com.tr/api/editor', formData).subscribe({
      next: response => console.log('Success:', response),
      error: error => console.error('Error:', error)
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Delete' && this.selectedItem) {
      this.deleteItem(this.selectedItem.id);
    }
  }

  deleteItem(itemId: number) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.selectedItem = null;
  }
}
