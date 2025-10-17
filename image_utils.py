from PIL import Image
import io
import os

class ImageProcessor:
    @staticmethod
    def create_thumbnail(image_file, max_size=(250, 320)):
        """
        이미지의 썸네일 버전 생성 (그리드뷰용)
        """
        try:
            # PIL Image로 열기
            img = Image.open(image_file)
            
            # 썸네일 생성 (비율 유지)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # RGBA 모드를 RGB로 변환 (JPEG 호환성)
            if img.mode in ('RGBA', 'LA', 'P'):
                # 흰색 배경으로 RGBA -> RGB 변환
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = rgb_img
            
            # 메모리 버퍼에 저장 (WebP 형식으로 더 작은 파일 크기)
            buffer = io.BytesIO()
            
            # WebP 지원 확인 후 사용, 아니면 JPEG 사용 (더 공격적인 압축)
            try:
                img.save(buffer, format='WebP', quality=60, optimize=True, method=6)
                buffer.seek(0)
            except Exception:
                # WebP 지원하지 않으면 JPEG 사용
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=60, optimize=True, progressive=True)
                buffer.seek(0)
            
            return buffer
            
        except Exception as e:
            print(f"Error creating thumbnail: {e}")
            return None
    
    @staticmethod
    def split_stitched_image(image_file, section_count):
        """
        가로로 이어붙인 이미지를 지정된 개수로 분할
        """
        try:
            # PIL Image로 열기
            img = Image.open(image_file)
            width, height = img.size
            
            # 각 섹션의 너비 계산
            section_width = width // section_count
            
            sections = []
            for i in range(section_count):
                left = i * section_width
                right = (i + 1) * section_width if i < section_count - 1 else width
                
                # 섹션 자르기
                section = img.crop((left, 0, right, height))
                
                # RGBA 모드를 RGB로 변환 (JPEG 호환성)
                if section.mode in ('RGBA', 'LA', 'P'):
                    # 흰색 배경으로 RGBA -> RGB 변환
                    rgb_section = Image.new('RGB', section.size, (255, 255, 255))
                    if section.mode == 'P':
                        section = section.convert('RGBA')
                    rgb_section.paste(section, mask=section.split()[-1] if section.mode in ('RGBA', 'LA') else None)
                    section = rgb_section
                
                # 메모리 버퍼에 저장
                buffer = io.BytesIO()
                section.save(buffer, format='JPEG', quality=90)
                buffer.seek(0)
                
                sections.append(buffer)
            
            return sections
            
        except Exception as e:
            print(f"Error splitting image: {e}")
            return []
    
    @staticmethod
    def create_file_objects(sections, item_id):
        """
        분할된 이미지들을 파일 객체로 변환
        """
        file_objects = []
        for i, section in enumerate(sections):
            # 파일 이름 생성
            filename = f"{item_id}_section_{i}.jpg"
            
            # 파일 객체 생성 (Flask File 객체와 유사하게)
            file_obj = type('FileObject', (), {
                'filename': filename,
                'stream': section,
                'read': section.read,
                'seek': section.seek
            })()
            
            file_objects.append(file_obj)
        
        return file_objects
    
    @staticmethod
    def process_individual_images(files, main_image_index):
        """
        개별 이미지들을 처리하고 메인 이미지를 첫 번째로 배치
        """
        try:
            if not files or main_image_index >= len(files):
                return files
            
            # 파일 리스트를 배열로 변환
            file_list = list(files)
            
            # 메인 이미지를 첫 번째로 이동
            if main_image_index > 0:
                main_image = file_list.pop(main_image_index)
                file_list.insert(0, main_image)
            
            return file_list
            
        except Exception as e:
            print(f"Error processing individual images: {e}")
            return files