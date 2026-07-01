import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/applepie",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ===================================================================
// Chinese Middle School Knowledge Points (Grade 7-9 Math + Physics)
// Based on 人教版 curriculum standards
// ===================================================================

interface SeedKnowledgePoint {
  name: string;
  subject: string;
  grade: string;
  chapter: string;
  keywords: string[];
  children?: SeedKnowledgePoint[];
}

const MATH_GRADE_7: SeedKnowledgePoint[] = [
  {
    name: "有理数", subject: "数学", grade: "七年级上", chapter: "第一章 有理数",
    keywords: ["正负数", "数轴", "相反数", "绝对值"],
    children: [
      { name: "正数和负数", subject: "数学", grade: "七年级上", chapter: "第一章", keywords: ["正数", "负数", "零"] },
      { name: "数轴", subject: "数学", grade: "七年级上", chapter: "第一章", keywords: ["数轴", "原点", "单位长度"] },
      { name: "相反数", subject: "数学", grade: "七年级上", chapter: "第一章", keywords: ["相反数", "互为相反数"] },
      { name: "绝对值", subject: "数学", grade: "七年级上", chapter: "第一章", keywords: ["绝对值", "距离"] },
      { name: "有理数的加减法", subject: "数学", grade: "七年级上", chapter: "第一章", keywords: ["加法", "减法", "运算律"] },
      { name: "有理数的乘除法", subject: "数学", grade: "七年级上", chapter: "第一章", keywords: ["乘法", "除法", "倒数"] },
      { name: "有理数的乘方", subject: "数学", grade: "七年级上", chapter: "第一章", keywords: ["乘方", "幂", "科学记数法"] },
    ],
  },
  {
    name: "整式的加减", subject: "数学", grade: "七年级上", chapter: "第二章 整式的加减",
    keywords: ["单项式", "多项式", "合并同类项"],
    children: [
      { name: "整式", subject: "数学", grade: "七年级上", chapter: "第二章", keywords: ["单项式", "多项式", "系数", "次数"] },
      { name: "合并同类项", subject: "数学", grade: "七年级上", chapter: "第二章", keywords: ["同类项", "合并", "去括号"] },
    ],
  },
  {
    name: "一元一次方程", subject: "数学", grade: "七年级上", chapter: "第三章 一元一次方程",
    keywords: ["方程", "解方程", "应用题"],
    children: [
      { name: "一元一次方程的概念", subject: "数学", grade: "七年级上", chapter: "第三章", keywords: ["方程", "解", "一元一次"] },
      { name: "解一元一次方程", subject: "数学", grade: "七年级上", chapter: "第三章", keywords: ["移项", "合并", "系数化1"] },
      { name: "一元一次方程应用题", subject: "数学", grade: "七年级上", chapter: "第三章", keywords: ["行程", "工程", "利润"] },
    ],
  },
];

const MATH_GRADE_8: SeedKnowledgePoint[] = [
  {
    name: "三角形", subject: "数学", grade: "八年级上", chapter: "第十一章 三角形",
    keywords: ["三角形", "内角和", "外角"],
    children: [
      { name: "三角形的边", subject: "数学", grade: "八年级上", chapter: "第十一章", keywords: ["三边关系", "分类"] },
      { name: "三角形的内角", subject: "数学", grade: "八年级上", chapter: "第十一章", keywords: ["内角和", "180度"] },
      { name: "三角形的外角", subject: "数学", grade: "八年级上", chapter: "第十一章", keywords: ["外角", "外角和"] },
    ],
  },
  {
    name: "全等三角形", subject: "数学", grade: "八年级上", chapter: "第十二章 全等三角形",
    keywords: ["全等", "SSS", "SAS", "ASA"],
    children: [
      { name: "全等三角形的概念", subject: "数学", grade: "八年级上", chapter: "第十二章", keywords: ["全等", "对应边", "对应角"] },
      { name: "SSS判定", subject: "数学", grade: "八年级上", chapter: "第十二章", keywords: ["边边边", "SSS"] },
      { name: "SAS判定", subject: "数学", grade: "八年级上", chapter: "第十二章", keywords: ["边角边", "SAS"] },
      { name: "ASA与AAS判定", subject: "数学", grade: "八年级上", chapter: "第十二章", keywords: ["角边角", "角角边"] },
    ],
  },
  {
    name: "一次函数", subject: "数学", grade: "八年级下", chapter: "第十九章 一次函数",
    keywords: ["函数", "正比例", "一次函数", "图像"],
    children: [
      { name: "变量与函数", subject: "数学", grade: "八年级下", chapter: "第十九章", keywords: ["变量", "常量", "函数定义"] },
      { name: "正比例函数", subject: "数学", grade: "八年级下", chapter: "第十九章", keywords: ["正比例", "y=kx", "图像"] },
      { name: "一次函数的图像与性质", subject: "数学", grade: "八年级下", chapter: "第十九章", keywords: ["y=kx+b", "斜率", "截距"] },
      { name: "一次函数与方程不等式", subject: "数学", grade: "八年级下", chapter: "第十九章", keywords: ["交点", "解集"] },
    ],
  },
  {
    name: "勾股定理", subject: "数学", grade: "八年级下", chapter: "第十七章 勾股定理",
    keywords: ["勾股定理", "直角三角形", "a²+b²=c²"],
    children: [
      { name: "勾股定理", subject: "数学", grade: "八年级下", chapter: "第十七章", keywords: ["勾三股四弦五", "a²+b²=c²"] },
      { name: "勾股定理的逆定理", subject: "数学", grade: "八年级下", chapter: "第十七章", keywords: ["判断直角", "逆定理"] },
      { name: "勾股定理的应用", subject: "数学", grade: "八年级下", chapter: "第十七章", keywords: ["最短路径", "实际问题"] },
    ],
  },
];

const MATH_GRADE_9: SeedKnowledgePoint[] = [
  {
    name: "一元二次方程", subject: "数学", grade: "九年级上", chapter: "第二十一章 一元二次方程",
    keywords: ["一元二次", "判别式", "韦达定理"],
    children: [
      { name: "一元二次方程的概念", subject: "数学", grade: "九年级上", chapter: "第二十一章", keywords: ["ax²+bx+c=0", "一般形式"] },
      { name: "配方法解一元二次方程", subject: "数学", grade: "九年级上", chapter: "第二十一章", keywords: ["配方", "完全平方"] },
      { name: "公式法解一元二次方程", subject: "数学", grade: "九年级上", chapter: "第二十一章", keywords: ["求根公式", "判别式"] },
      { name: "因式分解法解一元二次方程", subject: "数学", grade: "九年级上", chapter: "第二十一章", keywords: ["因式分解", "十字相乘"] },
      { name: "一元二次方程的根与系数关系", subject: "数学", grade: "九年级上", chapter: "第二十一章", keywords: ["韦达定理", "根与系数"] },
    ],
  },
  {
    name: "二次函数", subject: "数学", grade: "九年级上", chapter: "第二十二章 二次函数",
    keywords: ["二次函数", "抛物线", "顶点", "最值"],
    children: [
      { name: "二次函数的定义", subject: "数学", grade: "九年级上", chapter: "第二十二章", keywords: ["y=ax²+bx+c", "二次函数"] },
      { name: "二次函数y=ax²的图像", subject: "数学", grade: "九年级上", chapter: "第二十二章", keywords: ["抛物线", "开口", "对称轴"] },
      { name: "二次函数的图像与性质", subject: "数学", grade: "九年级上", chapter: "第二十二章", keywords: ["顶点", "对称轴", "最值"] },
      { name: "二次函数解析式的求法", subject: "数学", grade: "九年级上", chapter: "第二十二章", keywords: ["一般式", "顶点式", "交点式"] },
      { name: "二次函数与实际问题", subject: "数学", grade: "九年级上", chapter: "第二十二章", keywords: ["最值问题", "建模"] },
    ],
  },
  {
    name: "相似三角形", subject: "数学", grade: "九年级下", chapter: "第二十七章 相似",
    keywords: ["相似", "比例", "位似"],
    children: [
      { name: "相似三角形的判定", subject: "数学", grade: "九年级下", chapter: "第二十七章", keywords: ["AA", "SAS", "SSS相似"] },
      { name: "相似三角形的性质", subject: "数学", grade: "九年级下", chapter: "第二十七章", keywords: ["对应边成比例", "面积比"] },
    ],
  },
  {
    name: "锐角三角函数", subject: "数学", grade: "九年级下", chapter: "第二十八章 锐角三角函数",
    keywords: ["正弦", "余弦", "正切", "sin", "cos", "tan"],
    children: [
      { name: "正弦", subject: "数学", grade: "九年级下", chapter: "第二十八章", keywords: ["sin", "对边", "斜边"] },
      { name: "余弦和正切", subject: "数学", grade: "九年级下", chapter: "第二十八章", keywords: ["cos", "tan", "邻边"] },
      { name: "解直角三角形", subject: "数学", grade: "九年级下", chapter: "第二十八章", keywords: ["解直角三角形", "仰角", "俯角"] },
    ],
  },
];

const PHYSICS_GRADE_8_9: SeedKnowledgePoint[] = [
  {
    name: "机械运动", subject: "物理", grade: "八年级上", chapter: "第一章 机械运动",
    keywords: ["速度", "匀速", "参照物"],
    children: [
      { name: "长度和时间的测量", subject: "物理", grade: "八年级上", chapter: "第一章", keywords: ["刻度尺", "秒表", "误差"] },
      { name: "运动的描述", subject: "物理", grade: "八年级上", chapter: "第一章", keywords: ["参照物", "运动", "静止"] },
      { name: "速度", subject: "物理", grade: "八年级上", chapter: "第一章", keywords: ["v=s/t", "匀速", "变速"] },
    ],
  },
  {
    name: "力", subject: "物理", grade: "八年级下", chapter: "第七章 力",
    keywords: ["力", "重力", "弹力", "摩擦力"],
    children: [
      { name: "力的概念", subject: "物理", grade: "八年级下", chapter: "第七章", keywords: ["力的作用效果", "力的三要素"] },
      { name: "重力", subject: "物理", grade: "八年级下", chapter: "第七章", keywords: ["G=mg", "重心"] },
      { name: "弹力", subject: "物理", grade: "八年级下", chapter: "第七章", keywords: ["弹簧测力计", "胡克定律"] },
      { name: "摩擦力", subject: "物理", grade: "八年级下", chapter: "第八章", keywords: ["滑动摩擦", "静摩擦", "增大减小摩擦"] },
    ],
  },
  {
    name: "压强", subject: "物理", grade: "八年级下", chapter: "第九章 压强",
    keywords: ["压强", "液体压强", "大气压强"],
    children: [
      { name: "压强", subject: "物理", grade: "八年级下", chapter: "第九章", keywords: ["p=F/S", "增大减小压强"] },
      { name: "液体的压强", subject: "物理", grade: "八年级下", chapter: "第九章", keywords: ["p=ρgh", "连通器"] },
      { name: "大气压强", subject: "物理", grade: "八年级下", chapter: "第九章", keywords: ["托里拆利", "标准大气压"] },
    ],
  },
  {
    name: "浮力", subject: "物理", grade: "八年级下", chapter: "第十章 浮力",
    keywords: ["浮力", "阿基米德", "沉浮条件"],
    children: [
      { name: "浮力的概念", subject: "物理", grade: "八年级下", chapter: "第十章", keywords: ["浮力", "F浮=G排"] },
      { name: "阿基米德原理", subject: "物理", grade: "八年级下", chapter: "第十章", keywords: ["F浮=ρ液gV排", "阿基米德"] },
      { name: "物体的沉浮条件", subject: "物理", grade: "八年级下", chapter: "第十章", keywords: ["漂浮", "悬浮", "下沉"] },
    ],
  },
  {
    name: "简单机械", subject: "物理", grade: "八年级下", chapter: "第十二章 简单机械",
    keywords: ["杠杆", "滑轮", "机械效率"],
    children: [
      { name: "杠杆", subject: "物理", grade: "八年级下", chapter: "第十二章", keywords: ["力臂", "平衡条件", "F1L1=F2L2"] },
      { name: "滑轮", subject: "物理", grade: "八年级下", chapter: "第十二章", keywords: ["定滑轮", "动滑轮", "滑轮组"] },
      { name: "机械效率", subject: "物理", grade: "八年级下", chapter: "第十二章", keywords: ["有用功", "总功", "η=W有/W总"] },
    ],
  },
  {
    name: "欧姆定律", subject: "物理", grade: "九年级全", chapter: "第十七章 欧姆定律",
    keywords: ["电流", "电压", "电阻", "欧姆定律", "I=U/R"],
    children: [
      { name: "电流与电压电阻的关系", subject: "物理", grade: "九年级全", chapter: "第十七章", keywords: ["控制变量", "I-U图像"] },
      { name: "欧姆定律", subject: "物理", grade: "九年级全", chapter: "第十七章", keywords: ["I=U/R", "欧姆"] },
      { name: "电阻的测量", subject: "物理", grade: "九年级全", chapter: "第十七章", keywords: ["伏安法", "R=U/I"] },
    ],
  },
  {
    name: "电功率", subject: "物理", grade: "九年级全", chapter: "第十八章 电功率",
    keywords: ["电功", "电功率", "P=UI", "焦耳定律"],
    children: [
      { name: "电功", subject: "物理", grade: "九年级全", chapter: "第十八章", keywords: ["W=UIt", "电能"] },
      { name: "电功率", subject: "物理", grade: "九年级全", chapter: "第十八章", keywords: ["P=UI", "额定功率"] },
      { name: "焦耳定律", subject: "物理", grade: "九年级全", chapter: "第十八章", keywords: ["Q=I²Rt", "电流热效应"] },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding knowledge points...");

  const allPoints: SeedKnowledgePoint[] = [
    ...MATH_GRADE_7, ...MATH_GRADE_8, ...MATH_GRADE_9,
    ...PHYSICS_GRADE_8_9,
  ];

  // Clear existing data to avoid duplicates on re-run
  await prisma.studentKnowledgePoint.deleteMany();
  await prisma.knowledgePoint.deleteMany();

  let inserted = 0;

  for (const kp of allPoints) {
    const children = kp.children ?? [];
    const { children: _, ...parentData } = kp;

    const parent = await prisma.knowledgePoint.create({
      data: {
        name: parentData.name,
        subject: parentData.subject,
        grade: parentData.grade,
        textbookVersion: "人教版",
        chapter: parentData.chapter,
        keywords: parentData.keywords,
      },
    });
    inserted++;

    for (const child of children) {
      await prisma.knowledgePoint.create({
        data: {
          name: child.name,
          subject: child.subject,
          grade: child.grade,
          textbookVersion: "人教版",
          chapter: child.chapter,
          keywords: child.keywords,
          parentId: parent.id,
        },
      });
      inserted++;
    }
  }

  console.log(`✅ Seeded ${inserted} knowledge points`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
